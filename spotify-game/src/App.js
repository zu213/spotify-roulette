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

  const request = async (token, endpoint, searchKey=null) => {
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

  const searchArtists = async (e) => {
    e.preventDefault()
    const artistData = await request(token, 'search', {searchKey, type: 'artist'})
    setArtists(artistData.data.artists.items)
    const artistId = artistData.data.artists.items[0].id;


    const albumsData = await request(token, `artists/${artistId}/albums`)
    const albumId = albumsData.data.items[0].id;

    const tracksData = await request(token, `albums/${albumId}/tracks`)
    setTrack(tracksData.data.items[0]);

    await searchSong(e);
}

const searchSong = async (e) => {
  e.preventDefault()
  const trackData = await request(token, 'search', {searchKey, type: 'track'})
  const track = await request(token, `tracks/${trackData.data.tracks.items[0].id}`)

  setTrack2(track.data)
  
}

function playPlayer(id) {
  const iframe =document.getElementById(id);
  console.log('Interact: ', id)
  if(!iframe) return

  iframe.contentWindow.postMessage({command: 'toggle'}, '*');
}

const getUsersTopSongs = async () => {
  const topTracks = await axios.get(`https://api.spotify.com/v1/me/top/tracks`, {
    headers: {
        Authorization: `Bearer ${token}`
    },
  })
  const topTrackNames = topTracks.data.items.map((e) => {return(<div>{e.name}</div>)})
  setUserTopTracks(topTrackNames)
  }

const renderSong = (localTrack) => {
  const size =  {width: '100%', height: '100%'}
  const uri=`spotify:track:${localTrack ? localTrack.id : ''}`
  const view='list';
  const theme='light';
  // console.log('uri: ', `https://embed.spotify.com/?uri=${uri}&view=${view}&theme=${theme}`)
  console.log(localTrack)
   return (
      localTrack ?
       <div key={localTrack.id} className='Album-cover'>
        <iframe
         id="spotify2"
         title="Spotify"
         className="player"
         src={`https://embed.spotify.com/?uri=${uri}&view=${view}&theme=${theme}`}
         width={size.width}
         height={size.height}
         allowtransparency="true"
        />
        <div>
          {localTrack.album.images.length ? <img onClick={() => playPlayer('spotify2')} src={localTrack.album.images[0].url} alt=""/> : <div>No Image</div>}
          {localTrack.name}
        </div>
       </div> 
       :
        <div></div>
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
      />
          {artists[0].images.length ? <img onClick={() => playPlayer('spotify')} src={artists[0].images[0].url} alt=""/> : <div>No Image</div>}
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
            Search Artists
          <input type="text" onChange={e => setSearchKey(e.target.value)}/>
          <button type={"submit"}>Search</button>
          <div id="test"></div>
      </form>
      {renderArtists()}
      {renderSong(track2)}
      <div>
        <button onClick={getUsersTopSongs}>click</button>
      
      {userTopTracks.length > 0 ? (<div> {userTopTracks}</div>): (<div></div>)}
      </div>

      </div>
  );
}

export default App;
