import {useCallback, useEffect, useRef, useState} from 'react'
import './styles/App.css'
import { requestFromSpotify, getSpotifyAuthUrl, exchangeCodeForToken, wakeServer } from './helper/bridge'
import { Route, Routes, useNavigate} from 'react-router-dom'
import Game from './pages/Game'
import Join from './pages/Join'
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID

function isJsonString(str) {
  try {
    JSON.parse(str)
    return true
  } catch (e) {
    return false
  }
}

function App() {
  // Must be fragment-free and registered byte-for-byte in the Spotify dashboard.
  // Uses this frame's own URL (not window.top) so it works embedded in the site's iframe.
  const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI || window.location.origin + window.location.pathname

  const [token, setToken] = useState("")
  // True only inside the auth popup once it has finished, so we can show a
  // "you can close this" message if the browser won't let the popup self-close.
  const [popupDone, setPopupDone] = useState(false)
  // Handle to the auth popup, kept so the opener can close it (a popup often
  // can't close itself once COOP has stripped its script-closable status).
  const popupRef = useRef(null)
  const navigate = useNavigate()

  const codeToToken = useCallback(async (code) => {
    const data = await exchangeCodeForToken(CLIENT_ID, REDIRECT_URI, code).catch((e) => {
      // Keep a lightweight breadcrumb so a failed exchange isn't completely silent
      console.error('[auth] token exchange failed', e?.response?.status, e?.response?.data)
      return null
    })
    if (data){
      window.history.replaceState({}, "", "/")
      let tokenObj = {token: data.access_token, age: Date.now()}
      window.localStorage.setItem("token", JSON.stringify(tokenObj))
      return tokenObj
    }
  }, [REDIRECT_URI])

  const login = async (e) => {
    e.preventDefault()
    // Use a popup so this works in an iframe. Keep the handle so we can close
    // it from here once the popup reports back that login succeeded.
    popupRef.current = window.open(await getSpotifyAuthUrl(CLIENT_ID, REDIRECT_URI), 'spotify-login', 'popup,width=500,height=750')
  }

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'token' && e.newValue && isJsonString(e.newValue)) {
        setToken(JSON.parse(e.newValue).token)
        // Close the auth popup from the opener — self-close inside the popup is
        // blocked once COOP severs it, but the opener can still close it.
        try { popupRef.current?.close() } catch (err) { /* handle may be severed */ }
        popupRef.current = null
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Wake the sleeping demo server on load, and again whenever the user
  // returns to a tab that has been idle long enough for it to sleep again
  useEffect(() => {
    wakeServer()
    let lastWake = Date.now()
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastWake > 5 * 60 * 1000) {
        lastWake = Date.now()
        wakeServer()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useEffect(() => {(async () => {
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get("code")

    // Detect the auth popup via the OAuth `state` param — it comes back from Spotify
    // in the URL, so it survives COOP wiping window.name and severing window.opener.
    // (window.name is kept as a belt-and-suspenders fallback.)
    const isAuthPopup = searchParams.get('state') === 'spotify-login' || window.name === 'spotify-login'
    if (code && isAuthPopup) {
      await codeToToken(code)
      // Try to self-close; the opener also closes us via the storage event.
      // If both are blocked by COOP, popupDone renders a "you can close" note
      // instead of the misleading logged-out connect screen.
      window.close()
      setPopupDone(true)
      return
    }

    let tokenObj = window.localStorage.getItem("token")

    if(!code && !tokenObj) return

    // If no token and we have a code in the url get the token
    if (!tokenObj){
      tokenObj = await codeToToken(code)
    } else {
      if(isJsonString(tokenObj)){
        tokenObj = JSON.parse(tokenObj)
      }
      if(Date.now() - tokenObj.age > 60000){
        window.localStorage.removeItem("token")
      }
    }

    setToken(tokenObj ? tokenObj.token : null)

    // poke api to see if token is valid
    requestFromSpotify(tokenObj?.token, 'me/top/tracks')
    .then((response)=>{
      console.log('Success! ', tokenObj.token, response)
      navigate("/")
    })
    .catch(() => {
      console.log('Token invalid')
      setToken(null)
    })

  // Runs once on mount to handle the OAuth redirect / restore the saved token.
  // navigate's identity changes after every navigation, so listing it as a dep
  // would re-run this mid-session and bounce the user back to "/" (eg right after
  // they create a table).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })()}, [])

  const logout = () => {
    navigate("/")
    setToken("")
    window.localStorage.removeItem("token")
  }

  if (popupDone) {
    return (
      <div className='App'>
        <div className='login-hero'>
          <h4>✓ Connected</h4>
          <p>You're signed in. You can close this window and head back to the game.</p>

          <button className='sign-in-link' onClick={() => window.close()}>Close</button>
        </div>
      </div>
    )
  }

  return (
    <div className='App'>
    <div className="App-header">
      <h1>Spotify Roulette</h1>
        {token &&
          <button className='logout-button' onClick={logout}>Logout</button>
        }
    </div>
    {!token ?
      <div className='login-hero'>
        <h4>Guess whose song is playing</h4>
        <p>A live party game built on everyone's top tracks. Connect your account to spin up a table or join your friends.</p>
        <a className='sign-in-link' href='/' onClick={login}>Connect Spotify</a>
      </div>
      :
      <Routes>
        <Route exact path='/' element={<Join/>} />
        <Route exact path='/table' element={<Game token={token}/>} />
      </Routes>
    }
  </div>
  )
}

export default App
