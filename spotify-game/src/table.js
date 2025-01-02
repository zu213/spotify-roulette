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

  const [players, setPlayers] = useState([state.playerName])
  const [playerId, setPlayerId] = useState(null)
  const [endpointCode, setEndpointCode] = useState(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [song, setSong] = useState(null)
  const [chosenPlayer, setChosenPlayer] = useState(null)

  // generate soemthing random in future

  const playerIdRef = useRef(playerId);
  const endpointCodeRef = useRef(endpointCode)

  useEffect(() => {
    playerIdRef.current = playerId
  }, [playerId]);

  useEffect(() => {
    endpointCodeRef.current = endpointCode
  }, [endpointCode]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      axios.get(`http://localhost:5000/table/alive/${endpointCodeRef.current}/${playerIdRef.current}`).then((response) => {
        setPlayers(response.data['players'].map(e => e.playerName).join(', '))
        if(response.data['song']){
          setSong(response.data['song'])
          setChosenPlayer(response.data['chosenPlayer'])
          setGameStarted(true)
        }
      })
    }, 30000)

    return () => {clearInterval(intervalId)}
  })

  const playerName= state.playerName
  // request to make table
  if(!endpointCode){
    if(!existingTableCode){
      console.log('exist ' ,existingTableCode)
      axios.get(`http://localhost:5000/create/${playerName}`).then((response) => {
      setEndpointCode(response.data['code'])
      setPlayerId(response.data['playerId'])
      console.log(endpointCodeRef.current)
    }).catch((e) => {
      const navigationOptions = {
        replace: true,
        state: JSON.stringify({ error: e })
      };
      navigate('/', navigationOptions)
    })
    }else{
      axios.get(`http://localhost:5000/table/${existingTableCode}/${playerName}`).then((response) => {
        console.log(response)
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

  const startGame = () => {
    const i = Math.floor(Math.random() * players.length);
    setChosenPlayer(players[i]);

    axios.get(`http://localhost:5000/table/${existingTableCode}/song/${chosenPlayer}`).then((response) => {
      console.log(response)

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
        <button onClick={startGame}>start game</button>
        {gameStarted ? <Guess requestMethod={request} 
        players={players}
         player={chosenPlayer}
          tableCode={existingTableCode}
          song={song}></Guess> : <div></div> }
      </div>
  );
}

export default Table;