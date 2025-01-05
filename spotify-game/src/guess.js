import {useEffect, useState, memo} from 'react';
import './App.css';

let iframeFound = false;
let songStarted = false

const Guess = memo((props) => {
    // const [searchKey, setSearchKey] = useState("")
    const track = props.song
    const players = props.players.split(',')
    const player = props.player
    const [gameInPlay, setGameInPlay] = useState(true)
    const [timeLeft, setTimeLeft] = useState(25);
    const [guessTime, setGuessTime] = useState(null);
    const [intervalId, setIntervalId] = useState(null)
    const [showAlbum, setShowAlbum] = useState(false)
    const [showArtist, setShowArtist] = useState(false)
    const [showSong, setShowSong] = useState(false)
    const [chosenPlayer, setChosenPlayer] = useState(null)
    //const chosenPlayer = null;

    useEffect(() => {
        const element = document.getElementById('spotify');
          if (element && element.contentWindow && !iframeFound) {
              window.addEventListener('message', (m) => {
                if(m.data.type === 'playback_update' && !songStarted){
                  clearInterval(intervalId)
                  setGameInPlay(true)
                  startClock()
                  songStarted = true
                }
              }, [timeLeft])
              const intervalId = setInterval(() => {
                playPlayer('spotify');
              }, 500);

              iframeFound = true
          }
    }, [])

    const playPlayer = (id) => {
      const iframe =document.getElementById(id);
      if(!iframe) return
      console.log('Interact: ', id, iframe)
      iframe.contentWindow.postMessage({command: 'toggle'}, '*');
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

    const startClock =  () => {
      setTimeLeft(25)
      if(intervalId) clearInterval(intervalId)
      let localTime = 25
      const id = setInterval(() => {

        if(localTime < 2){
          clearInterval(id)
          setIntervalId(null)
          playPlayer('spotify')
        }

        if(localTime < 20){
          setShowAlbum(true)
        }
        if(localTime < 15){
          setShowArtist(true)
        }
        if(localTime < 10){
          setShowSong(true)
        }
        if(localTime < 2){
          setGameInPlay(() => false)
        }
        localTime--

        setTimeLeft(() => localTime)
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

    const answer = () => {
      return (
        <span>{player}</span>
      )
    }

    const playerGuess = (i) => {
      setGuessTime(timeLeft)
      setChosenPlayer(i)
    }

  return (
    <div className="map">
      {timeLeft}
      <br />
      {renderSong(track)}
      <div>
        {gameInPlay}
        {gameInPlay ? playerButtons() : chosenPlayer ? playerAnswer() : ''}
      </div>
      <div>
        {guessTime ? guessTime : 'not guessed yet'}
      </div>
      <div>
        Answer: {!gameInPlay ? answer(): 'player' }
      </div>

    </div>
  );
})

export default Guess;