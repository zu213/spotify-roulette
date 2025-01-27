import {useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'
import Guess from './guess';
import './App.css';
import axios from 'axios';

function Table(props) {
  const location = useLocation();
  const state = location.state
  const existingTableCode = state?.existingTableCode || null
  const navigate = useNavigate();
  const request = props.requestMethod

  const [players, setPlayers] = useState(state.playerName)
  const [playerId, setPlayerId] = useState(null)
  const [endpointCode, setEndpointCode] = useState(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [song, setSong] = useState(null)
  const [chosenPlayer, setChosenPlayer] = useState(null)

  const playerIdRef = useRef(playerId);
  const endpointCodeRef = useRef(endpointCode)
  var tableOwner = !existingTableCode;

  const getUsersTopSongs = async () => {
    const topTracks = await request(`me/top/tracks`)

    return topTracks.data.items
  }

  useEffect(() => {
    playerIdRef.current = playerId
  }, [playerId]);

  useEffect(() => {
    endpointCodeRef.current = endpointCode
  }, [endpointCode]);


  useEffect(() => {
    const id =  setInterval(() => {
      axios.get(`http://localhost:5000/table/alive/${endpointCodeRef.current}/${playerIdRef.current}`).then((response) => {
        setPlayers(response.data['players'].map(e => e.playerName).join(', '))
        if(response.data['song'] && !gameStarted){
          setSong({id: response.data['song'].id, 
            name: response.data['song'].name,
            album: response.data['song'].album,
            artists: response.data['song'].artists
          })
          setChosenPlayer(response.data['chosenPlayer'])
          setGameStarted(true)
        }
      })
    }, 30000)

    const playerName= state.playerName
    getUsersTopSongs().then((topTracks) => {
      // request to make table
      if(!endpointCode){
        if(!existingTableCode){
          axios.post(`http://localhost:5000/create/${playerName}`,topTracks).then((response) => {
          setEndpointCode(response.data['code'])
          setPlayerId(response.data['playerId'])
        }).catch((e) => {
          const navigationOptions = {
            replace: true,
            state: JSON.stringify({ error: e })
          };
          navigate('/', navigationOptions)
        })
        }else{
          axios.post(`http://localhost:5000/table/${existingTableCode}/${playerName}`,topTracks).then((response) => {
            setEndpointCode(existingTableCode)
            setPlayers(response.data['players'].map(e => e.playerName).join(', '))
            setPlayerId(response.data['playerId'])
          }).catch((e) => {
            const navigationOptions = ({
              state: { error: e }
            });
            navigate('/', navigationOptions)
          })
        }
      }
    })

    return () => {clearInterval(id)}
  }, [gameStarted, endpointCode, existingTableCode])

  const startGame = () => {
    const playerList = players.split(',')
    const i = Math.floor(Math.random() * playerList.length);
    setChosenPlayer(playerList[i]);
    axios.get(`http://localhost:5000/table/${endpointCode}/song/${playerList[i]}`).then(() => {
      //console.log(response)
    }).catch((e) => {
      console.log('error', e)
    })
  };
  
  return (
      <div className="App">
        code:
        <div>{endpointCode}</div>
        players:
        <div>{players}</div>
        {tableOwner ? <button onClick={startGame}>start game</button> : <div></div>}
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
  );
}

export default Table;