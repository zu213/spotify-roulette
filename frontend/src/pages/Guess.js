import '../styles/Guess.css'

import {useEffect, useState, useRef} from 'react'

const Guess = (props) => {
    const track = props.song
    const players = props.players
    const player = props.player
    const ws = props.ws
    // Game state: loading, in-play, done
    const [gameState, setGameState] = useState('loading')
    const [timeLeft, setTimeLeft] = useState(30)
    const [guessTime, setGuessTime] = useState(null)
    const [showAlbum, setShowAlbum] = useState(false)
    const [showArtist, setShowArtist] = useState(false)
    const [showSong, setShowSong] = useState(false)
    // interval to kick clock
    const [intervalId, setIntervalId] = useState(null)

    const [chosenPlayer, setChosenPlayer] = useState(null)
    const songStarted = useRef(false)

    useEffect(() => {
      // forced get element by id
      const iframe = document.getElementById('spotify')
      if (!iframe || !iframe.contentWindow) return

      const handleMessage = (m) => {
        if(m.data?.type == 'ready') {
          playPlayer('spotify')
        } else if (m.data?.type === 'playback_update' && !songStarted.current) {
          songStarted.current = true
          setGameState('in-play')
          startClock()
        }
      }

      window.addEventListener('message', handleMessage)

      // Cleanup when track changes or component unmounts
      return () => {
        window.removeEventListener('message', handleMessage)
        songStarted.current = false
      }
    }, [track])

    const playPlayer = (id) => {
      const iframe =document.getElementById(id)
      if(!iframe) return
      iframe.contentWindow.postMessage({command: 'toggle'}, '*')
    }

    const renderSong = (localTrack) => {
      const size =  {width: '1%', height: '1%'}
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
              <div>Artist: <span className={!showArtist ? 'hidden' : ''}>{i.name}{i < localTrack.artists.length - 1 && `,`}</span>
              </div>
            ))}
            <div>Track: <span className={!showSong ? 'hidden' : ''}>{localTrack.name}</span></div>
          </div>
        </div> 
      )
    }

    const startClock = () => {
      if (intervalId) clearInterval(intervalId)
      setTimeLeft(30)

      const id = setInterval(() => {
        setTimeLeft(prev => {
          // Stop the timer when it reaches 0
          if (prev <= 1) {
            clearInterval(intervalId)
            clearInterval(id)
            setIntervalId(null)
            setGameState('done')
            if(gameState == 'in-play'){
              playPlayer('spotify')
            }
            return 0
          }

          if (prev <= 20) setShowAlbum(true)
          if (prev <= 15) setShowArtist(true)
          if (prev <= 10) setShowSong(true)

          return prev - 1
        })
      }, 1000)

      setIntervalId(id)
    }

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
      songStarted.current = false
      setGameState('loading')
    }


  return (
    <div className="Guess">
      {gameState === 'loading' && 
        <div className='loader-container'>
          <h3>Loading</h3>
          <div className="loader"></div>
        </div>
      }
      <div className={gameState === 'loading' ? 'none' : ''}>
        <div className='Guess-timer'> Time left: {timeLeft} </div>
        {renderSong(track)}
        <div>
          {gameState === 'in-play' && !chosenPlayer ?
            playerButtons() 
            : chosenPlayer ?
            <span>Your answer: {chosenPlayer.playerName}</span>
            : <span>Did not guess in time!</span>
          }
        </div>
        <div>
          {guessTime && `Time of your guess: ${guessTime}` }
        </div>
        <div>
          Answer: {gameState == 'done' && <span>{player?.playerName}</span> }
        </div>
        <div>
          {gameState == 'done' && 
            <button onClick={startRound} >
              Next round
            </button>
          }
        </div>
      </div>
    </div>
  )
}

export default Guess