import {useState} from 'react';
import { useNavigate } from "react-router-dom";
import './App.css';

function Search(props) {

  const request = props.requestMethod
  const navigate = useNavigate();
  const [searchKey, setSearchKey] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [tableNotFound, setTableNotFound] = useState(null)

  const findTable = async () => {
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
    const navigationOptions = ({
      state: { playerName: playerName }
    });
    navigate("/table", navigationOptions);
  }

  return (
      <div className="App">

          <form onSubmit={findTable}>
            table code
          <input type="text" onChange={e => setSearchKey(e.target.value)}/>
          player name:
          <input type="text" onChange={e => setPlayerName(e.target.value)}/>
          <button type={"submit"}>join table</button>
          {tableNotFound ? <div>Errror</div>: ''}
      `</form>

      <button onClick={createTable}>create table</button>

      </div>
  );
}

export default Search;