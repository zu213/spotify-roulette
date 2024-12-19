import {useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'
import './App.css';
import axios from 'axios';

function Table() {
  const location = useLocation();
  const state = location.state
  const existingTableCode = state?.existingTableCode || null
  console.log(existingTableCode)

  const [players, setPlayers] = useState(['me'])
  const [endpointCode, setEndpointCode] = useState(null)
  // generate soemthing random in future

  // fake endpoint
  useEffect(() => {

    //setPlayers((players) => players + ['joe'])
    const playerName= 'aaa'
    // request to make table
    if(!endpointCode){
    if(!existingTableCode){
      axios.get(`http://localhost:5000/create/${playerName}`).then((response) => {
      console.log(response)
      console.log(response.data['code']);
      setEndpointCode(response.data['code'])})
    }else{
      axios.get(`http://localhost:5000/table/${existingTableCode}/${playerName}`).then((response) => {
        console.log(response)
        console.log(response.data['code']);
        setEndpointCode(existingTableCode)
        setPlayers(response.data['players'].join(', '))
      })
    }
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