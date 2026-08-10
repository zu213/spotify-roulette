import '../styles/Game.css'

import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { requestFromSpotify, SERVER_WS_URL, waitForServer } from '../helper/bridge'

import Guess from './Guess'
import Leaderboard from './Leaderboard'

function Game(props) {
  const location = useLocation()
  const state = location.state
  const existingTableCode = state?.existingTableCode || null
  const navigate = useNavigate()
  const request = props.requestSpotify

  const [players, setPlayers] = useState([])
  const [tableCode, setTableCode] = useState(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [song, setSong] = useState(null)
  const [tableLoading, setTableLoading] = useState(true)
  const [chosenPlayer, setChosenPlayer] = useState(null)
  const [heartbeat, setHeartbeat] = useState(null)
  const [ws, setWs] = useState(null)
  const [scores, setScores] = useState([])

  const tableOwner = !existingTableCode

  const getUsersTopSongs = async () => {
    const topTracks = await requestFromSpotify(props.token, `me/top/tracks`).catch((error) => {
      const navigationOptions = { replace: true, state: JSON.stringify({ error })}
      navigate('/', navigationOptions)
    })

    return topTracks?.data?.items
  }

  const processWSMessage = (data) => {
    if(!data['type']) return

    switch (data['type']) {
      case 'start_round':
        if(data['song'] && !gameStarted){
          setSong({id: data['song'].id, 
            name: data['song'].name,
            album: data['song'].album,
            artists: data['song'].artists
          })
          setGameStarted(true)
          setChosenPlayer(null)
        }
        break

      case 'table_info':
        setPlayers(data['players'])
        setTableCode(data['tableCode'])
        setScores(data['scores'])
        break

      case 'show_leaderboard':
        setChosenPlayer(data['answer'])
        setScores(data['scores'])
        break

      default:
        break
    }
  }

  useEffect(() => {
    let retryTimeout = null

    getUsersTopSongs().then(async topTracks => {
      const playerName= state.playerName
      const websocketURL = `${SERVER_WS_URL}?playername=` + playerName + (existingTableCode ? `&tableid=${existingTableCode}` : '')

      // The free demo server sleeps when idle. Make sure it answers over HTTP
      // (i.e. it's awake) before trying to upgrade to a WebSocket — a socket
      // opened against a sleeping server is refused/dropped and looks like a
      // disconnect. Join already waits via getTable(); Create didn't, so cold
      // starts failed here.
      await waitForServer()

      // Keep retrying the socket too, in case it's still stabilising post-wake
      const connect = (attemptsLeft) => {
      const websocket = new WebSocket(websocketURL)
      let opened = false
      // A connect to a still-waking server can hang without ever firing
      // onclose; force a retry after a few seconds instead of stalling.
      const openTimer = setTimeout(() => { if (!opened) websocket.close() }, 8000)

      websocket.onopen = () => {
        opened = true
        clearTimeout(openTimer)
        // console.log("Connected to server")
        // Setup heartbeat
        setHeartbeat(setInterval(() => {
          if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({type: "ping"}))
          }
        }, 15000))
        setTableLoading(false)

        // Send top tracks
        websocket.send(JSON.stringify({
          type: "submit_tracks",
          playerName: playerName,
          tracks: topTracks
        }))
      }

      websocket.onmessage = event => {
        // console.log("Server:", event.data)
        const data = JSON.parse(event.data)
        processWSMessage(data)
      }

      websocket.onclose = () => {
        clearTimeout(openTimer)
        console.log("Disconnected")
        clearInterval(heartbeat)
        setHeartbeat(null)

        // Never connected, the server is probably still waking up
        if (!opened && attemptsLeft > 0) {
          retryTimeout = setTimeout(() => connect(attemptsLeft - 1), 5000)
          return
        }

        const navigationOptions = { replace: true, state: JSON.stringify({ error: 'Disconnected from table connection with server'}) }
        navigate('/', navigationOptions)
      }

      setWs(websocket)
      }

      connect(20)
    })

    return () => {
      if (ws) {
        ws.close()
        setWs(null)
      }
      clearInterval(heartbeat)
      setHeartbeat(null)
      clearTimeout(retryTimeout)
    }
    // Runs once on mount to open the table websocket; re-running on every
    // dependency change would tear down and reconnect the socket mid-game.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startRound = () => {
    ws.send(JSON.stringify({
      type: "start_round",
    }))
  }
  
  return (
    <div className="game">
      {tableLoading ? 
      <div className='loader-container loader-container--join'>
        <h3>Loading</h3>
        <div className="loader"></div>
        <p className='loader-note'>The demo server sleeps when idle — the first connection can take up to a minute while it wakes up.</p>
      </div>
      :
      <>
        <div className='Table-code'>
          <span className='eyebrow'>Table code</span>
          <span className='Table-code-value'>{tableCode}</span>
        </div>
        <div className='leaderboard-container'>
          <Leaderboard scores={scores} />
        </div>
        {tableOwner && !gameStarted &&
          <div className='lobby'>
            <p className='lobby-hint'>Share the code above. Once everyone's in, kick things off.</p>
            <button className='start-game-button' onClick={startRound}>Start game</button>
          </div>
        }
        {gameStarted && 
        <Guess 
          key={song.id}
          requestMethod={request} 
          players={players}
          player={chosenPlayer}
          ws={ws}
          startRound={startRound}
          tableCode={existingTableCode}
          song={song} />
        }
      </>
      }
    </div>
  )
}

export default Game