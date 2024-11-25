import {useEffect, useState} from 'react';
import './App.css';
import axios from 'axios';
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;

function App() {
  
  const REDIRECT_URI = "http://localhost:3000"
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize"
  const RESPONSE_TYPE = "token"

  const [token, setToken] = useState("")
  const [searchKey, setSearchKey] = useState("")
  const [artists, setArtists] = useState([])
  const [track, setTrack] = useState(null)
  const [track2, setTrack2] = useState(null)
  const [userTopTracks, setUserTopTracks] = useState([])


  useEffect(() => {
      const hash = window.location.hash
      let token = window.localStorage.getItem("token")

      if (!token && hash) {
          token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1]

          window.location.hash = ""
          window.localStorage.setItem("token", token)
      }

      setToken(token)

  }, [])

  const logout = () => {
      setToken("")
      window.localStorage.removeItem("token")
  }

  const searchArtists = async (e) => {
    e.preventDefault()
    const {data} = await axios.get("https://api.spotify.com/v1/search", {
        headers: {
            Authorization: `Bearer ${token}`
        },
        params: {
            q: searchKey,
            type: "artist"
        }
    })

    setArtists(data.artists.items)
    const id = data.artists.items[0].id;
    const albums = await axios.get(`https://api.spotify.com/v1/artists/${id}/albums`, {
      headers: {
          Authorization: `Bearer ${token}`
      },
    })
    console.log(albums);
    const id2 = albums.data.items[0].id;
    const tracks = await axios.get(`https://api.spotify.com/v1/albums/${id2}/tracks`, {
      headers: {
          Authorization: `Bearer ${token}`
      },
  })
  setTrack(tracks.data.items[0]);
  searchSong(e);
}

const searchSong = async (e) => {
  e.preventDefault()
  console.log('aaa')
  const {data} = await axios.get("https://api.spotify.com/v1/search", {
      headers: {
          Authorization: `Bearer ${token}`
      },
      params: {
          q: searchKey,
          type: "track"
      }
  })
  console.log('test',data.tracks)
  const track = await axios.get(`https://api.spotify.com/v1/tracks/${data.tracks.items[0].id}`, {
    headers: {
        Authorization: `Bearer ${token}`
    },
    params: {
        q: searchKey,
        type: "track"
    }
})
  console.log('aaaa', track)
  setTrack2(track.data)
  
}

const play = () => {
  const iframe =document.getElementById('spotify');
  iframe.contentWindow.postMessage({command: 'toggle'}, '*');
}

const play2 = () => {
  const iframe =document.getElementById('spotify2');
  iframe.contentWindow.postMessage({command: 'toggle'}, '*');
}

const getUsersTopSongs = async () => {
  const topTracks = await axios.get(`https://api.spotify.com/v1/me/top/tracks`, {
    headers: {
        Authorization: `Bearer ${token}`
    },
})
const test = topTracks.data.items.map((e) => {return(<div>{e.name}</div>)})
console.log('bbb', test)
setUserTopTracks(test)
}

const renderSong = () => {
  const size =  {width: '100%', height: '100%'}
  const uri=`spotify:track:${track2 ? track2.id : ' '}`
  const view='list';
  const theme='light';
  
   return (
       track2 ?
       <div key={track2.id} className='Album-cover'>
               <iframe
               id="spotify2"
         title="Spotify"
         className="player"
         src={`https://embed.spotify.com/?uri=${uri}&view=${view}&theme=${theme}`}
         width={size.width}
         height={size.height}
         frameBorder="0"
         allowtransparency="true"
       />   {track2.album.images.length ? <img onClick={play2} src={track2.album.images[0].url} alt=""/> : <div>No Image</div>}
           {track2.name}
       </div> : <div></div>
   )
 }

const renderArtists = () => {
 const size =  {width: '100%', height: '100%'}
 const uri=`spotify:track:${track ? track.id : ''}`
 const view='list';
 const theme='light';
 
  return (
      artists.length > 0 ?
      <div key={artists[0].id} className='Album-cover'>
              <iframe
              id="spotify"
        title="Spotify"
        className="player"
        src={`https://embed.spotify.com/?uri=${uri}&view=${view}&theme=${theme}`}
        width={size.width}
        height={size.height}
        frameBorder="0"
        allowtransparency="true"
      /> 
          {artists[0].images.length ? <img onClick={play} src={artists[0].images[0].url} alt=""/> : <div>No Image</div>}
          {artists[0].name}
      </div> : <div></div>
  )
}


  return (
      <div className="App">
          <header className="App-header">
              <h1>Spotify React</h1>
              {!token ?
                  <a href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-top-read`}>Login
                      to Spotify</a>
                  : <button onClick={logout}>Logout</button>}
          </header>
          <form onSubmit={searchArtists}>
          <input type="text" onChange={e => setSearchKey(e.target.value)}/>
          <button type={"submit"}>Search</button>
          <div id="test"></div>
      </form>
      {renderArtists()}
      {renderSong()}
                <div>
                  <button onClick={getUsersTopSongs}>click</button>
                
                {userTopTracks.length > 0 ? (<div> {userTopTracks}</div>): (<div></div>)}
                </div>

      </div>
  );
}

export default App;
