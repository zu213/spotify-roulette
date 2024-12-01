import {useEffect, useState, componentDidMount} from 'react';
import './App.css';
import axios from 'axios';


function Guess(props) {
  const [searchKey, setSearchKey] = useState("")
  const [artist, setArtist] = useState([])
  const [track, setTrack] = useState(null)
  const [players, setPlayers] = useState(['me'])
  const [gameInPlay, setGameInPlay] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60);
  const [intervalId, setIntervalId] = useState(null)


  const request = props.requestMethod


  const searchSong = async (e) => {
    
    e.preventDefault()
    const trackData = await request('search', {searchKey, type: 'track'})
    const track = await request(`tracks/${trackData.data.tracks.items[0].id}`)

    setTrack(track.data)
    
  }

  const playPlayer = (id) => {
    const iframe =document.getElementById(id);
    console.log('Interact: ', id)
    if(!iframe) return

    iframe.contentWindow.postMessage({command: 'toggle'}, '*');
  }

  const getUsersTopSongs = async () => {
    const topTracks = await request(`me/top/tracks`)

    const topTrackNames = topTracks.data.items.map((e) => {return(<div>{e.name}</div>)})
    console.log(topTracks.data.items)
    return topTracks.data.items
  }

  const renderSong = (localTrack) => {
    const size =  {width: '100%', height: '100%'}
    const uri=`spotify:track:${localTrack ? localTrack.id : ''}`
    const view='list';
    const theme='light';
    // console.log('uri: ', `https://embed.spotify.com/?uri=${uri}&view=${view}&theme=${theme}`)
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
            <br />
            {Array.from(localTrack.artists, (i) => (<span>{i.name},</span>))}
            <br />
            {localTrack.name}
          </div>
        </div> 
        :
          <div></div>
    )
  }

  const playGame = () => {
    getUsersTopSongs().then((userTopTracks) => {

      const i = Math.floor(Math.random() * players.length);
      const chosenPlayer = players[i];

      const j = Math.floor(Math.random() * userTopTracks.length);
      const chosenSong = userTopTracks[j]
      setTrack(chosenSong)
      setGameInPlay(true)

      console.log(chosenSong, userTopTracks)
      //clearInterval(intervalId);
      console.log('before',timeLeft)
  
  
      // clear interval on re-render to avoid memory leaks
    });

    setTimeLeft(60)
    if(intervalId) clearInterval(intervalId)
    const id = setInterval(() => {
      if(timeLeft < 1){
        clearInterval(intervalId)
        setIntervalId(null)
      }
      setTimeLeft(timeLeft => timeLeft - 1)
    }, 1000);
    setIntervalId(id)
  }

  const playerButtons = () => {
    return (
      Array.from(players, (i) => (
        <button onClick={() => {playerGuess(i)}}>
          {i}
        </button>
      ))
    )
  }

  const playerGuess = (guess) => {
    //setGameInPlay(false)
    clearInterval(intervalId)
    setIntervalId(null)

  }


  return (
    <div className="App">
      <button onClick={() => playGame()}>Play game</button>
      {timeLeft}
      <br />
      {renderSong(track)}
      <div>
        {gameInPlay ? playerButtons() : ''}
      </div>

    </div>
  );
}

export default Guess;