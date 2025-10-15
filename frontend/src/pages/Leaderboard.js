import '../styles/Leaderboard.css'

function Leaderboard(props) {
  const scores = props.scores
  console.log(scores)

  return (
    <div className='leaderboard' >
      <div className='leaderboard-title'>
        <span>Player</span> <span>Score</span>
      </div>
      {scores?.map((score) =>
        <>
          <div className='leaderboard-entry' key={score.playerName}>
            <span>{score?.playerName}</span> <span>{score?.score}</span>
          </div>
        </>
      )}
    </div>
  )
}

export default Leaderboard