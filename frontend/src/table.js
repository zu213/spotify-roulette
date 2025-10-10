import {useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Guess from './guess'
import { postPlayer, requestFromSpotify } from './bridge'

function Table(props) {
  const location = useLocation()
  const state = location.state
  const existingTableCode = state?.existingTableCode || null
  const navigate = useNavigate()
  const request = props.requestSpotify

  const [players, setPlayers] = useState(state.playerName)
  const [playerId, setPlayerId] = useState(null)
  const [endpointCode, setEndpointCode] = useState(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [song, setSong] = useState(null)
  const [gameLoading, setGameLoading] = useState(false)
  const [chosenPlayer, setChosenPlayer] = useState(null)
  const [heartbeat, setHeartbeat] = useState(null)

  const playerIdRef = useRef(playerId)
  const endpointCodeRef = useRef(endpointCode)
  const tableOwner = !existingTableCode

  const getUsersTopSongs = async () => {
    const topTracks = await requestFromSpotify(props.token, `me/top/tracks`).catch((e) => {
      const navigationOptions = {
        replace: true,
        state: JSON.stringify({ error: e })
      }
      navigate('/', navigationOptions)
    })

    return topTracks?.data?.items
  }

  useEffect(() => {
    playerIdRef.current = playerId
  }, [playerId])

  useEffect(() => {
    endpointCodeRef.current = endpointCode
  }, [endpointCode])



  useEffect(() => {

    getUsersTopSongs().then(topTracks => {

      const playerName= state.playerName

      const websocket = 'ws://localhost:5000?playername=' + playerName + (existingTableCode ? `&tableid=${existingTableCode}` : '')
      const ws = new WebSocket(websocket)
      console.log(websocket)

      ws.onopen = () => {
        console.log("Connected to server")
        setHeartbeat(setInterval(() => ws.send("ping"), 10000))

        // send top tracks
        ws.send(JSON.stringify({
          type: "submit_tracks",
          tableId: endpointCodeRef.current,
          playerName: playerName,
          tracks: topTracks
        }))
      }

      ws.onmessage = event => {
        console.log("Server:", event.data)
      }
      ws.onclose = () => {
        console.log("Disconnected")
        clearInterval(heartbeat)
      }
    })


    /*
    const id2 =  setInterval(() => {
      axios.get(`http://localhost:5000/table/alive/${endpointCodeRef.current}/${playerIdRef.current}`).then((response) => {
        setPlayers(response.data['players'].map(e => e.playerName).join(','))
        if(response.data['song'] && !gameStarted){
          setSong({id: response.data['song'].id, 
            name: response.data['song'].name,
            album: response.data['song'].album,
            artists: response.data['song'].artists
          })
          setChosenPlayer(response.data['chosenPlayer'])
          setGameStarted(true)
          setGameLoading(false)
        }
      })
    }, 30000)
    

    getUsersTopSongs().then((topTracks) => {
      // request to make table
      if(!endpointCode){
        if(!existingTableCode){
          // Create new table
          postPlayer(playerName, topTracks).then((response) => {
          setEndpointCode(response.data['code'])
          setPlayerId(response.data['playerId'])
        }).catch((e) => {
          const navigationOptions = {replace: true, state: JSON.stringify({ error: e })}
          navigate('/', navigationOptions)
        })
        } else {
          // Join table
          postPlayerToTable(existingTableCode, playerName, topTracks).then((response) => {
            setEndpointCode(existingTableCode)
            setPlayers(response.data['players'].map(e => e.playerName).join(', '))
            setPlayerId(response.data['playerId'])
          }).catch((e) => {
            const navigationOptions = ({
              state: { error: e }
            })
            navigate('/', navigationOptions)
          })
        }
      }
        
    })*/

  }, [gameStarted, endpointCode, existingTableCode, state.playerName, getUsersTopSongs, navigate])

  const startGame = () => {
    setGameLoading(true)
    const playerList = players.split(',')
    const i = Math.floor(Math.random() * playerList.length)
    setChosenPlayer(playerList[i])
    getTablePlayer(endpointCode, playerList[i]).then(() => {
      //console.log(response)
    }).catch((e) => {
      console.log('error', e)
    })
  }
  
  return (
      <div className="App-body">
        <div className='Table-code'>Table code: {endpointCode} </div>
        <div className='Players-list'>
          <div className='Players-title'> Players:</div>
          {players}
        </div>
        {tableOwner && !gameStarted ? (gameLoading ? <div>Loading... <span className="Table-loader"></span></div> : <button onClick={startGame}>start game</button> ) : <div></div>}
        {gameStarted ? 
        <Guess 
          key={song.id}
          requestMethod={request} 
          players={players}
          player={chosenPlayer}
          tableCode={existingTableCode}
          song={song} />
        : <div/> }
      </div>
  )
}

export default Table