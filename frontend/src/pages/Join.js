import '../styles/Join.css'

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getTable } from '../helper/bridge'

function Join() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state

  const [searchKey, setSearchKey] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState(null)

  // Update error message
  useEffect(()  => {
    if (state) {
      const parsedState = JSON.parse(state)
      setError(JSON.stringify(parsedState.error))
    }
  }, [state])

  const findTable = async (e) => {
    e.preventDefault()

    // Check key is valid
    const isValidTable = /^\d{1,3}$/.test(searchKey)
    if (!isValidTable) return setError('Enter a valid table number if joining')

    // check if tabkle exists if so join
    getTable(searchKey).then(_ => {
      navigate('/table', {state: {existingTableCode: searchKey, playerName: playerName }})
    })
    .catch(e => {
      if(e.status == 404) {
        setError(`Table "${searchKey}" not found`)
      }
    })
  }

  const createTable = (e) => {
    e.preventDefault()

    if(!playerName){
      setError('No player name inputted')
      return
    }
    navigate('/table', {state: { playerName: playerName }})
  }

  return (
    <div className='join'>
      <div className='join-form-container'>
        <div className='join-form'>
          <div>
            <label>Game Code: </label>
            <input type='text' onChange={e => setSearchKey(e.target.value)}/>
          </div>
          <div>
            <label>Player Name: </label>
            <input type='text' onChange={e => setPlayerName(e.target.value)}/>
          </div>
        </div>
      </div>
      <div className='join-buttons'>
        <div className='join-button'>
          <button onClick={findTable}>Join Game</button>
        </div>
        <div className='join-button'>
          <button onClick={createTable}>Create Game</button>
        </div>
      </div>

      {error && <textarea className='join-error' readOnly unselectable='on' value={error}></textarea>}
    </div>
  )
}

export default Join