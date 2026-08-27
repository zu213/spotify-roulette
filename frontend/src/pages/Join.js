import '../styles/Join.css'

import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getTable } from '../helper/bridge'

const CODE_LENGTH = 3

function Join() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state

  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''))
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const inputsRef = useRef([])

  const tableCode = digits.join('')
  const codeComplete = digits.every(d => d !== '')

  // Update error message
  useEffect(()  => {
    if (state) {
      const parsedState = JSON.parse(state)
      setError(JSON.stringify(parsedState.error))
    }
  }, [state])

  const focusBox = (i) => {
    const el = inputsRef.current[i]
    if (el) { el.focus(); el.select() }
  }

  // Write one or more digits starting at box `i`, then advance focus.
  const fill = (i, chars) => {
    const next = [...digits]
    let idx = i
    for (const c of chars) {
      if (idx >= CODE_LENGTH) break
      next[idx] = c
      idx++
    }
    setDigits(next)
    focusBox(Math.min(idx, CODE_LENGTH - 1))
  }

  const handleChange = (i, raw) => {
    const value = raw.replace(/\D/g, '')
    if (!value) {
      const next = [...digits]
      next[i] = ''
      setDigits(next)
      return
    }
    fill(i, value.split(''))
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      focusBox(i - 1)
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focusBox(i - 1)
    } else if (e.key === 'ArrowRight' && i < CODE_LENGTH - 1) {
      focusBox(i + 1)
    }
  }

  const handlePaste = (i, e) => {
    e.preventDefault()
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '')
    if (text) fill(i, text.split(''))
  }

  const findTable = async (e) => {
    e.preventDefault()

    if (!codeComplete) return setError('Enter all 3 digits of the table code to join')

    // check if table exists, if so join
    setError(null)
    setConnecting(true)
    getTable(tableCode).then(_ => {
      navigate('/table', {state: {existingTableCode: tableCode, playerName: playerName }})
    })
    .catch(e => {
      if(e.status === 404) {
        setError(`Table "${tableCode}" not found`)
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
              <label htmlFor='gameCode-0'>Table code <span className='join-optional'>— only to join</span></label>
              <div className='code-boxes' role='group' aria-label='Three digit table code'>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    id={`gameCode-${i}`}
                    ref={el => (inputsRef.current[i] = el)}
                    className='code-box'
                    type='text'
                    inputMode='numeric'
                    autoComplete='off'
                    maxLength={1}
                    value={d}
                    aria-label={`Digit ${i + 1} of 3`}
                    placeholder='0'
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={e => handlePaste(i, e)}
                    onFocus={e => e.target.select()}
                  />
                ))}
              </div>
              <p className='code-hint'>Table codes are always 3 digits.</p>
            </div>
          </div>
          <div className='join-buttons'>
            <button className='join-primary' onClick={createTable}>Create game</button>
            <button className='join-secondary' onClick={findTable} disabled={!codeComplete || connecting}>Join game</button>
          </div>

          {connecting && <p className='join-connecting' role='status'>Contacting the server — it sleeps when idle, so this can take up to a minute.</p>}
          {error && <div className='join-error' role='alert'>{error}</div>}
        </div>
      </div>
    </div>
  )
}

export default Join
