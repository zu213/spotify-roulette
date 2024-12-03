import {useEffect, useState} from 'react';
import './App.css';
import axios from 'axios';
import { Route, Routes} from 'react-router-dom';
import Trial from './trial';
import Guess from './guess';
import Table from './table';
import Search from './search';
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;

function App() {
  
  const REDIRECT_URI = "http://localhost:3000"
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize"
  const RESPONSE_TYPE = "token"

  const [token, setToken] = useState("")


  useEffect(() => {
      const hash = window.location.hash
      let token = window.localStorage.getItem("token")


      if (!token && hash) {
          token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1]
          window.location.hash = ""
          window.localStorage.setItem("token", token)
      }
      console.log(token)

      setToken(token)

      // poke api to see if token is valid
      request('me').catch(() => {console.log('aaa');setToken(null)})


  }, [])

  console.log(token)

  const logout = () => {
      setToken("")
      window.localStorage.removeItem("token")
  }

  const request = async (endpoint, searchKey=null) => {
    if(!token) return

    const requestObject = {}
    // console.log('token: ',token)
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
      <h1>Spotify React</h1>
        {!token ?
          <a href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-top-read`}>Login
              to Spotify</a>
        : <button onClick={logout}>Logout</button>}
    </div>
    <Routes>
      <Route exact path='/trial' element={<Trial/>} />
      <Route exact path='/' element={<Search requestMethod={request}/>} />
      <Route exact path='/table' element={<Table requestMethod={request}/>} />
      <Route exact path='/guess' element={<Guess requestMethod={request}/>} />

    </Routes>
  </div>
  );
}

export default App;
