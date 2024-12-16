import {useState, useEffect} from 'react';
import './App.css';
import axios from 'axios';

function Table() {


  const [players, setPlayers] = useState(['me'])
  const endpointCode = '123456' // generate soemthing random in future

  // fake endpoint
  useEffect(() => {

    setPlayers((players) => players + ['joe'])
    const playerName= 'aaa'
    // request to make table
    axios.get(`http://localhost:5000/create/${playerName}`)


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