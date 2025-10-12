import {useEffect, useState, memo} from 'react'

let iframeFound = false
let songStarted = false

const Guess = memo((props) => {
    // const [searchKey, setSearchKey] = useState("")
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
    //const chosenPlayer = null

    useEffect(() => {
      const element = document.getElementById('spotify')
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
            playPlayer('spotify')
          }, 500)

          iframeFound = true
      }
    }, [gameInPlay])

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
          localTrack ?
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
              {localTrack.album.images.length ? <div className='Album-cover'><img className={!showAlbum ? 'Album-cover-hidden' : ''} onClick={() => playPlayer('spotify')} src={localTrack.album.images[0].url} alt=""/></div> : <div className='Album-cover'>No Image</div>}
              {Array.from(localTrack.artists, (i) => (<div>Artist: <span className={!showArtist ? 'hidden' : ''}>{i.name},</span></div>))}
              <br />
              <div>Track: <span className={!showSong ? 'hidden' : ''}>{localTrack.name}</span></div>
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
      setGameInPlay(true)
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
})

export default Guess