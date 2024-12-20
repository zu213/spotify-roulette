import {useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom'
import './App.css';
import axios from 'axios';

function Table() {
  const location = useLocation();
  const state = location.state
  const existingTableCode = state?.existingTableCode || null
  console.log(existingTableCode)

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


  // fake endpoint
  useEffect(() => {

    //setPlayers((players) => players + ['joe'])
    const playerName= state.playerName
    // request to make table
    if(!endpointCode){
    if(!existingTableCode){
      axios.get(`http://localhost:5000/create/${playerName}`).then((response) => {
      console.log(response)
      console.log(response.data['code']);
      setEndpointCode(response.data['code'])
      setPlayerId(response.data['playerId'])
    })
    }else{
      axios.get(`http://localhost:5000/table/${existingTableCode}/${playerName}`).then((response) => {
        console.log(response)
        console.log(response.data['code']);
        setEndpointCode(existingTableCode)
        setPlayers(response.data['players'].map(e => e.playerName).join(', '))
        setPlayerId(response.data['playerId'])
      })
    }

    setInterval(() => {
      axios.get(`http://localhost:5000/table/alive/${endpointCodeRef.current}/${playerIdRef.current}`).then((response) => {
        setPlayers(response.data['players'].map(e => e.playerName).join(', '))
      })
    }, 30000)
  }


}, [])
  
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