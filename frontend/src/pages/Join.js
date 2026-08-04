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
  const [connecting, setConnecting] = useState(false)

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
    setError(null)
    setConnecting(true)
    getTable(searchKey).then(_ => {
      navigate('/table', {state: {existingTableCode: searchKey, playerName: playerName }})
    })
    .catch(e => {
      if(e.status === 404) {
        setError(`Table "${searchKey}" not found`)
      }
    })
    .finally(() => setConnecting(false))
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
        <div className='join-card'>
          <span className='eyebrow'>New round</span>
          <h2 className='join-heading'>Create or join a table</h2>
          <p className='join-sub'>Enter a name to start a new game, or add a table code to join friends already at a table.</p>
          <div className='join-form'>
            <div className='join-field'>
              <label htmlFor='playerName'>Player name</label>
              <input id='playerName' type='text' placeholder='e.g. Bob' autoComplete='off' onChange={e => setPlayerName(e.target.value)}/>
            </div>
            <div className='join-field'>
              <label htmlFor='gameCode'>Table code <span className='join-optional'>— only to join</span></label>
              <input id='gameCode' type='text' inputMode='numeric' placeholder='e.g. 123' autoComplete='off' onChange={e => setSearchKey(e.target.value)}/>
            </div>
          </div>
          <div className='join-buttons'>
            <button className='join-primary' onClick={createTable}>Create game</button>
            <button className='join-secondary' onClick={findTable}>Join game</button>
          </div>

          {connecting && <p className='join-connecting' role='status'>Contacting the server — it sleeps when idle, so this can take up to a minute.</p>}
          {error && <div className='join-error' role='alert'>{error}</div>}
        </div>
      </div>
    </div>
  )
}

export default Join