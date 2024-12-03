import {useEffect, useState} from 'react';
import './App.css';
import axios from 'axios';
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;

function Table() {
  
 
  return (
      <div className="App">

        players:
        <div>bob</div>
        <button>start game</button>

      </div>
  );
}

export default Table;