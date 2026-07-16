import {useEffect, useState} from 'react'
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
  const navigate = useNavigate()

  async function codeToToken(code){
    const data = await exchangeCodeForToken(CLIENT_ID, REDIRECT_URI, code).catch(() => null)
    if (data){
      window.history.replaceState({}, "", "/")
      let tokenObj = {token: data.access_token, age: Date.now()}
      window.localStorage.setItem("token", JSON.stringify(tokenObj))
      return tokenObj
    }
  }

  const login = async (e) => {
    e.preventDefault()
    // Use a popup so this works in an iframe
    window.open(await getSpotifyAuthUrl(CLIENT_ID, REDIRECT_URI), 'spotify-login', 'popup,width=500,height=750')
  }

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'token' && e.newValue && isJsonString(e.newValue)) {
        setToken(JSON.parse(e.newValue).token)
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
    const code = new URLSearchParams(window.location.search).get("code")

    if (code && window.opener) {
      await codeToToken(code)
      window.close()
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

  })()}, [])

  const logout = () => {
    navigate("/")
    setToken("")
    window.localStorage.removeItem("token")
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
      <div>
        <h4>You must login to Spotify to use this app</h4>
        <a className='sign-in-link' href='/' onClick={login}>Login to Spotify</a>
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
