import {useState, useEffect} from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import './App.css';

function Search(props) {

  const request = props.requestMethod
  const navigate = useNavigate();
  const [searchKey, setSearchKey] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [tableNotFound, setTableNotFound] = useState(null)
  const [error, setError] = useState(null)

  const location = useLocation();
  const state = location.state
  

  useEffect(()  => {
    if(state){
      const parsedState = JSON.parse(state)
      console.log(parsedState.error)
      setError(parsedState.error)
    }
  }, [])

  const findTable = async (e) => {
    e.preventDefault()
    setTableNotFound(false)
    // check if tabkle exists if so join
    await request(`me/top/tracks`)
    if(true){
      const navigationOptions = ({
        state: {existingTableCode :  searchKey, playerName: playerName }
      });
      navigate("/table", navigationOptions);
    }
    setTableNotFound(true)
  }

  const createTable = () => {
    if(!playerName){
      setError("No player name inputted")
      return
    }
    const navigationOptions = ({
      state: { playerName: playerName }
    });
    navigate("/table", navigationOptions);
  }

  return (
    <div className="App-body">

      <form onSubmit={findTable}>
        <div className='Search-form-container'>
          <div className='Search-form'>
            <div>
              <label>Table code: </label>
              <input id="tableCodeInput" type="text" onChange={e => setSearchKey(e.target.value)}/>
            </div>
            <div>
              <label>Player name: </label>
              <input id="playerNameInput" type="text" onChange={e => setPlayerName(e.target.value)}/>
            </div>
          </div>
        </div>
        <div className='Search-buttons'>
          <button type={"submit"}>join table</button>
          <button onClick={createTable}>create table</button>
        </div>
        {tableNotFound ? <div>Error</div>: ''}
      </form>


      {error ? <div>{error.message} </div> : <div></div>}

    </div>
  );
}

export default Search;