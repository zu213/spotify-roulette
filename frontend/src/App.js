import {useEffect, useState} from 'react'
import './styles/App.css'
import { requestFromSpotify } from './bridge'
import { Route, Routes, useNavigate} from 'react-router-dom'
import Table from './table'
import Search from './search'
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
  const REDIRECT_URI = "http://localhost:3000"
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize"
  const RESPONSE_TYPE = "token"

  const [token, setToken] = useState("")
  const navigate = useNavigate()

  function hashToToken(hash){
    if (hash && hash.substring(1).split("/").find(elem => elem.startsWith("access_token"))){
      let token = hash.substring(1).split("/").find(elem => elem.startsWith("access_token")).split("=")[1]
      window.location.hash = ""
      let tokenObj = {token, age: Date.now()}
      window.localStorage.setItem("token", JSON.stringify(tokenObj))
      return tokenObj
    }
  }

  useEffect(() => {
    const hash = window.location.hash
    let tokenObj = window.localStorage.getItem("token")

    if(!hash && !tokenObj) return

    // If no token and we have a hash in url get the token
    if (!tokenObj){
      tokenObj = hashToToken(hash)
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
    // Didn't work until i chaned the code to log for some reason
    requestFromSpotify(token, 'me/top/tracks')
    .then((response)=>{
      console.log('Success! ', tokenObj.token, response)
      navigate("/")
    })
    .catch(() => {
      console.log('Token invalid')
      setToken(null)
    })

  }, [])

  const logout = () => {
    navigate("/")
    setToken("")
    window.localStorage.removeItem("token")
  }

  return (
    <div className='App'>
    <div className="App-header">
      <h1>Spotify Roulette</h1>
        {token ?
          <button onClick={logout}>Logout</button>
          : <a href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-top-read`}>Login to Spotify</a>
        }
    </div>
    {token &&
      <Routes>
        <Route exact path='/' element={<Search/>} />
        <Route exact path='/table' element={<Table token={token}/>} />
      </Routes>
    }
  </div>
  )
}

export default App
