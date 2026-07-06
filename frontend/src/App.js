import {useEffect, useState} from 'react'
import './styles/App.css'
import { requestFromSpotify, getSpotifyAuthUrl, exchangeCodeForToken } from './helper/bridge'
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
  const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI || "http://127.0.0.1:3000"

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
    window.location = await getSpotifyAuthUrl(CLIENT_ID, REDIRECT_URI)
  }

  useEffect(() => {(async () => {
    const code = new URLSearchParams(window.location.search).get("code")
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
