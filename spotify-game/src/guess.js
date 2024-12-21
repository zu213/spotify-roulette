import {useEffect, useState} from 'react';
import './App.css';

let iframeFound = false;
let songStarted = false

function Guess(props) {
  // const [searchKey, setSearchKey] = useState("")
  const [track, setTrack] = useState(null)
  const [players, setPlayers] = useState(['me'])
  const [gameInPlay, setGameInPlay] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60);
  const [guessTime, setGuessTime] = useState(null);
  const [intervalId, setIntervalId] = useState(null)
  const [showAlbum, setShowAlbum] = useState(false)
  const [showArtist, setShowArtist] = useState(false)
  const [showSong, setShowSong] = useState(false)
  const [chosenPlayer, setChosenPlayer] = useState(null)




  const request = props.requestMethod
useEffect(() => {
  // observer that waits for iframe to load then adds a interval to keep trying to play the song until it is able to.
  const observer = new MutationObserver((mutations, observer) => {
    const element = document.getElementById('spotify');
    

      if (element && element.contentWindow && !iframeFound) {
          observer.disconnect();

          window.addEventListener('message', (m) => {
            if(m.data.type === 'playback_update' && !songStarted){
              clearInterval(intervalId)
              startClock()
              songStarted = true
            }
          }, [timeLeft])
          const intervalId = setInterval(() => {
            playPlayer('spotify');
          }, 500);

          iframeFound = true
      }
  }, [timeLeft]);

  observer.observe(document.body, {
      childList: true,
      subtree: true,
  });
}, [])

  const playPlayer = (id) => {
    const iframe =document.getElementById(id);
    if(!iframe) return
    console.log('Interact: ', id, iframe)

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
    return (
        localTrack ?
        <div key={localTrack.id} className='Album-cover'>
          <iframe
          id="spotify"
          title="Spotify"
          className="player"
          src={`https://embed.spotify.com/?uri=${uri}&view=${view}&theme=${theme}`}
          width={size.width}
          height={size.height}
          allowtransparency="true"
          />
          <div>
            {localTrack.album.images.length ? <img className={!showAlbum ? 'hidden' : ''} onClick={() => playPlayer('spotify')} src={localTrack.album.images[0].url} alt=""/> : <div>No Image</div>}
            <br />
            {Array.from(localTrack.artists, (i) => (<span className={!showArtist ? 'hidden' : ''}>{i.name},</span>))}
            <br />
            <div className={!showSong ? 'hidden' : ''}>{localTrack.name}</div>
          </div>
        </div> 
        :
          <div></div>
    )
  }

  const playGame = () => {
    getUsersTopSongs().then((userTopTracks) => {

      const i = Math.floor(Math.random() * players.length);
      setChosenPlayer(players[i]);

      const j = Math.floor(Math.random() * userTopTracks.length);
      const chosenSong = userTopTracks[j]

      setShowAlbum(false)
      setShowArtist(false)
      setShowSong(false)

      setTrack(chosenSong)
      setGameInPlay(true)
  
  
        // clear interval on re-render to avoid memory leaks
      });
    }

    const startClock =  () => {

      setTimeLeft(60)
      if(intervalId) clearInterval(intervalId)
      let localTime = 60
      const id = setInterval(() => {
        if(localTime < 1){
          clearInterval(id)
          setIntervalId(null)
          playPlayer('spotify')
        }
        console.log('a')

        if(localTime < 45){
          console.log('aa')
          setShowAlbum(true)
        }
        if(localTime < 30){
          console.log('ab')
          setShowArtist(true)
        }
        if(localTime < 15){
          setShowSong(true)
        }
        localTime--
        //console.log(localTime)

        setTimeLeft(localTime)
        console.log(timeLeft)
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

    const playerAnswer = () => {
      return (
        <span>{chosenPlayer}</span>
      )
    }

    const playerGuess = (guess) => {
      setGuessTime(timeLeft)

    }


  return (
    <div className="map">
      <button onClick={() => playGame()}>Play game</button>
      {timeLeft}
      <br />
      {renderSong(track)}
      <div>
        {gameInPlay ? playerButtons() : chosenPlayer ? playerAnswer() : ''}
      </div>
      <div>
        {guessTime ? guessTime : 'aa'}
      </div>

    </div>
  );
}

export default Guess;