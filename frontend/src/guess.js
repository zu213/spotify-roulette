import {useEffect, useState, memo} from 'react'

let iframeFound = false
let songStarted = false

const Guess = (props) => {
    const track = props.song
    const players = props.players
    const player = props.player
    const ws = props.ws
    const [gameInPlay, setGameInPlay] = useState(true)
    const [timeLeft, setTimeLeft] = useState(25)
    const [guessTime, setGuessTime] = useState(null)
    const [intervalId, setIntervalId] = useState(null)
    const [showAlbum, setShowAlbum] = useState(false)
    const [showArtist, setShowArtist] = useState(false)
    const [showSong, setShowSong] = useState(false)
    const [chosenPlayer, setChosenPlayer] = useState(null)

    useEffect(() => {
      const element = document.getElementById('spotify')
      console.log('played:', element, element.contentWindow, !iframeFound)
      if (element && element.contentWindow && !iframeFound) {
        window.addEventListener('message', m => {
          if(m.data.type === 'playback_update' && !songStarted){
            clearInterval(intervalId)
            setGameInPlay(true)
            startClock()
            songStarted = true
          }
        }, [timeLeft])
        const intervalId = setInterval(() => {
          playPlayer('spotify')
        }, 500)
        console.log(intervalId)

        iframeFound = true
      }
    }, [track])

    const playPlayer = (id) => {
      const iframe =document.getElementById(id)
      if(!iframe) return
      console.log('Interact: ', id, iframe)
      iframe.contentWindow.postMessage({command: 'toggle'}, '*')
    }

    const renderSong = (localTrack) => {
      const size =  {width: '100%', height: '100%'}
      const uri=`spotify:track:${localTrack ? localTrack.id : ''}`
      const view='list'
      const theme='light'
      return (
        localTrack &&
        <div key={localTrack.id}>
          <iframe
          id="spotify"
          title="Spotify"
          className="Player"
          src={`https://embed.spotify.com/?uri=${uri}&view=${view}&theme=${theme}`}
          width={size.width}
          height={size.height}
          allowtransparency="true"
          />
          <div>
            {localTrack.album.images.length ? 
              <div className='Album-cover'>
                <img className={!showAlbum ? 'Album-cover-hidden' : ''} src={localTrack.album.images[0].url} alt=""/>
              </div>
              :<div className='Album-cover'>No Image</div>}
            {Array.from(localTrack.artists, (i) => (
              <div>Artist: <span className={!showArtist ? 'hidden' : ''}>{i.name},</span>
              </div>
            ))}
            <br />
            <div>Track: <span className={!showSong ? 'hidden' : ''}>{localTrack.name}</span></div>
          </div>
        </div> 
      )
    }

    const startClock = () => {
      if (intervalId) clearInterval(intervalId);
      setTimeLeft(25)

      const id = setInterval(() => {
        setTimeLeft(prev => {
          // Stop the timer when it reaches 0
          if (prev <= 1) {
            clearInterval(id)
            setIntervalId(null)
            playPlayer('spotify')
            setGameInPlay(false)
            return 0
          }

          if (prev <= 20) setShowAlbum(true)
          if (prev <= 15) setShowArtist(true)
          if (prev <= 10) setShowSong(true)

          return prev - 1
        });
      }, 1000);

      setIntervalId(id);
    };



    const playerButtons = () => {
      return (
        <div> Players:&nbsp;
         {Array.from(players, (player) => (
          <button onClick={() => {playerGuess(player)}}>
            {player.playerName}
          </button>
        ))}
        </div>
      )
    }

    const playerAnswer = () => {
      return (
        <span>Your answer: {chosenPlayer.playerName}</span>
      )
    }

    const answer = () => {
      return (
        <span>{player?.playerName}</span>
      )
    }

    const playerGuess = (player) => {
      setGuessTime(timeLeft)
      setChosenPlayer(player)
      ws.send(JSON.stringify({
        type: "guess_made",
        playerId: player['id'],
      }))
    }

    const startRound = () => {
      props.startRound()
      iframeFound = false
      songStarted = false
    }


  return (
    <div className="Guess">
      <div className='Guess-timer'> Time left: {timeLeft} </div>
      {renderSong(track)}
      <div>
        {gameInPlay && !chosenPlayer ? playerButtons() : chosenPlayer ? playerAnswer() : ''}
      </div>
      <div>
         {guessTime ? `Time of your guess: ${guessTime}` : '' }
      </div>
      <div>
        Answer: {!gameInPlay ? answer() : '' }
      </div>
      {!gameInPlay && 
        <button onClick={startRound} >
          Next round
        </button>
      }

    </div>
  )
}

export default Guess