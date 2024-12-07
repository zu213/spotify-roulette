import {useState} from 'react';
import './App.css';

function Table() {

  const [players, setPlayers] = useState(['me'])
  const endpoint = '123456' // generate soemthing random in future

  // fake endpoint
  setPlayers(players + ['joe'])
  
  return (
      <div className="App">

        code:
        <div>{endpoint}</div>
        players:
        <div>{players}</div>

        <button>start game</button>

      </div>
  );
}

export default Table;