function Leaderboard(props) {
  const scores = props.scores
  console.log(scores)

  return (
    <div className='tst' >
      {scores?.map(score => 
        <div key={score.playerName}>
          {score?.playerName} | {score?.score}
        </div>
      )}
    </div>
  )
}

export default Leaderboard