import {useState, useEffect, useRef, useCallback } from 'react';
import { replace, useLocation, useNavigate } from 'react-router-dom'
import './App.css';
import axios from 'axios';

function Table() {
  const location = useLocation();
  const state = location.state
  const existingTableCode = state?.existingTableCode || null
  const navigate = useNavigate();


  const [players, setPlayers] = useState([state.playerName])
  const [playerId, setPlayerId] = useState(null)
  const [endpointCode, setEndpointCode] = useState(null)
  // generate soemthing random in future

  const playerIdRef = useRef(playerId);
  const endpointCodeRef = useRef(endpointCode);
  useEffect(() => {
    playerIdRef.current = playerId; // Update the ref with the latest state on every render
  }, [playerId]);

  useEffect(() => {
    endpointCodeRef.current = endpointCode; // Update the ref with the latest state on every render
  }, [endpointCode]);

  const playerName= state.playerName
  // request to make table
  if(!endpointCode){
    if(!existingTableCode){
      console.log('exist ' ,existingTableCode)
      axios.get(`http://localhost:5000/create/${playerName}`).then((response) => {
      setEndpointCode(response.data['code'])
      setPlayerId(response.data['playerId'])
      setInterval(() => {
        axios.get(`http://localhost:5000/table/alive/${endpointCodeRef.current}/${playerIdRef.current}`).then((response) => {
          setPlayers(response.data['players'].map(e => e.playerName).join(', '))
        })
      }, 30000)
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
        console.log(response.data['code']);
        setEndpointCode(existingTableCode)
        setPlayers(response.data['players'].map(e => e.playerName).join(', '))
        setPlayerId(response.data['playerId'])
        setInterval(() => {
          axios.get(`http://localhost:5000/table/alive/${endpointCodeRef.current}/${playerIdRef.current}`).then((response) => {
            setPlayers(response.data['players'].map(e => e.playerName).join(', '))
          })
        }, 30000)
      }).catch((e) => {
        const navigationOptions = ({
          state: { error: e }
        });
        navigate('/', navigationOptions)
      })
    }
  }
  
  return (
      <div className="App">

        code:
        <div>{endpointCode}</div>
        players:
        <div>{players}</div>

        <button>start game</button>

      </div>
  );
}

export default Table;