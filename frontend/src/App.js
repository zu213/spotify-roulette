import {useEffect, useState} from 'react';
import './App.css';
import axios from 'axios';
import { Route, Routes, useNavigate} from 'react-router-dom';
import Table from './table';
import Search from './search';
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;

function isJsonString(str) {
  try {
      JSON.parse(str);
  } catch (e) {
      return false;
  }
  return true;
}

function App() {
  
  const REDIRECT_URI = "http://localhost:3000"
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize"
  const RESPONSE_TYPE = "token"

  const [token, setToken] = useState("")
  const navigate = useNavigate();


  useEffect(() => {
      const hash = window.location.hash
      let tokenObj = window.localStorage.getItem("token")

      if (!tokenObj && hash) {
        if( hash.substring(1).split("/").find(elem => elem.startsWith("access_token"))){
          console.log('hash', hash)
          let token = hash.substring(1).split("/").find(elem => elem.startsWith("access_token")).split("=")[1]
          window.location.hash = ""
          tokenObj = {token, age: Date.now()}
          window.localStorage.setItem("token", JSON.stringify(tokenObj))
        }
      }

      if(tokenObj){
        console.log(tokenObj)
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
      request('me/top/tracks')
      .then((response)=>{
        console.log('Success! ', tokenObj.token, response)
        navigate("/");
      })
      .catch(() => {
        console.log('Token invalid')
        setToken(null)
      })


  }, [])

  const logout = () => {
      navigate("/");
      setToken("")
      window.localStorage.removeItem("token")
  }

  const request = async (endpoint, searchKey=null) => {
    if(!token) return

    const requestObject = {}
    requestObject.headers =  {
      Authorization: `Bearer ${token}`
    }
    if(searchKey){
      requestObject.params = {
        q: searchKey.searchKey,
        type: searchKey.type
     }
    }

    return await axios.get(`https://api.spotify.com/v1/${endpoint}`, requestObject)
  }

 
  return (
    <div className='App'>
    <div className="App-header">
      <h1>Spotify Roulette</h1>
        {!token ?
          <a href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-top-read`}>Login
              to Spotify</a>
        : <button onClick={logout}>Logout</button>}
    </div>
    {token ?
    <Routes>
      <Route exact path='/' element={<Search requestMethod={request}/>} />
      <Route exact path='/table' element={<Table requestMethod={request}/>} />

    </Routes>
    : ''}
  </div>
  );
}

export default App;
