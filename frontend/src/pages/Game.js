import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Guess from './Guess'
import Leaderboard from './Leaderboard'
import { requestFromSpotify } from '../helper/bridge'

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

  useEffect(() => {
    getUsersTopSongs().then(topTracks => {

      const playerName= state.playerName

      const websocket = 'ws://localhost:5000?playername=' + playerName + (existingTableCode ? `&tableid=${existingTableCode}` : '')
      let localWs = new WebSocket(websocket)

      localWs.onopen = () => {
        console.log("Connected to server")
        setHeartbeat(setInterval(() => {
          if (localWs.readyState === WebSocket.OPEN) {
            localWs.send(JSON.stringify({type: "ping"}))
          }
        }, 10000))
        setTableLoading(false)

        // send top tracks
        localWs.send(JSON.stringify({
          type: "submit_tracks",
          playerName: playerName,
          tracks: topTracks
        }))
      }

      localWs.onmessage = event => {
        console.log("Server:", event.data)
        const data = JSON.parse(event.data)
        switch (data['type']) {
          case 'start_round':
            if(data['song'] && !gameStarted){
              setSong({id: data['song'].id, 
                name: data['song'].name,
                album: data['song'].album,
                artists: data['song'].artists
              })
              setGameStarted(true)
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

          default:
            break
        }
      }
      localWs.onclose = () => {
        console.log("Disconnected")
        clearInterval(heartbeat)
        setHeartbeat(null)
        const navigationOptions = {
          replace: true,
          state: JSON.stringify({ error: `Disconnected from table connection with server` })
        }
        navigate('/', navigationOptions)
      }

      setWs(localWs)
    })

    return () => {
      if (ws) {
        ws.close()
        setWs(null)
      }
      clearInterval(heartbeat)
      setHeartbeat(null)
    }
  }, [])

  const startRound = () => {
    ws.send(JSON.stringify({
      type: "start_round",
    }))
  }
  
  return (
      <div className="game">
        {tableLoading ? <div>Loading... <span className="loader"></span></div>
        :
        <>
          <div className='Table-code'>Table code: {tableCode} </div>
          <div className='Players-list'>
            <div className='Players-title'> Players:</div>
            {players.map(id => id.playerName).join(',')}
          </div>
          {tableOwner && !gameStarted && <button onClick={startRound}>start game</button>}
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
          <Leaderboard scores={scores} />
        </>
        }
      </div>
  )
}

export default Game