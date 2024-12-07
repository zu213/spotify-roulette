import {useState} from 'react';
import { useNavigate } from "react-router-dom";
import './App.css';

function Search(props) {

  const request = props.requestMethod
  const navigate = useNavigate();
  const [searchKey, setSearchKey] = useState("")
  const [tableNotFound, setTableNotFound] = useState(null)

  const findTable = async () => {
    setTableNotFound(false)
    // check if tabkle exists if so join
    await request(`me/top/tracks`)
    if(true){
      navigate("/table");
    }
    setTableNotFound(true)
  }

  const createTable = () => {
    navigate("/table");
  }

  return (
      <div className="App">

          <form onSubmit={findTable}>
            table code
          <input type="text" onChange={e => setSearchKey(e.target.value)}/>
          <button type={"submit"}>join table</button>
          {tableNotFound ? <div>Errror</div>: ''}
      `</form>

      <button onClick={createTable}>create table</button>

      </div>
  );
}

export default Search;