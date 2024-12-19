// Import the Express module
const express = require('express');
const cors = require('cors');

const PORT = process.argv[2] || 5000;
const timeToLive = 30
// Create an Express application
const app = express();
let lastActivityTime = Date.now();
const inactivityTimeout = timeToLive * 60 * 1000;
const tables = []

function checkInactivity() {
  const currentTime = Date.now();
  console.log(`Time since last message: ${(currentTime - lastActivityTime)/ 1000} seconds`)
  if (currentTime - lastActivityTime >= inactivityTimeout) {
    console.log(`No activity for ${timeToLive} minutes. Terminating server process...`);
    process.exit();  // Terminate the child process
  }
}

app.use(cors());

app.get('/create/:player', (req, res) => {
  var number
  const playerName = req.params.player
  const min = 0;
  const max = 999;

  for(var i = 0 ; i < 5; i++){
    
    number = Math.floor(Math.random() * (max - min + 1)) + min;
    if(tables.includes(number)){
      number = null
      continue
    }

  }
  if(number){
    res.send({message: `Successfully created: code ${number}`, code: number});
    tables.push({code: number, players: [playerName]})
    lastActivityTime  = Date.now()
  }else{
    res.send(`Unable to create table :( limit hit`);
  }
});

app.get('/table/:id/:player', (req, res) => {
  const id = req.params.id
  const playerName = req.params.player

  if(id){
    const table = tables.find((table) => table.code == id)
    if(table && playerName){
      const foundIndex = tables.findIndex(table => table.code == id);
      table.players.push(playerName)
      tables[foundIndex] = table;
      res.send({message: `Table ${id} found`, players: table.players});
    }else{
      res.send(`Table ${id} not found`);
    }
  }else{
    res.send(`Unable to create table :( limit hit`);
  }
  lastActivityTime  = Date.now()

});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Start the heartbeat, dies after X mins
setInterval(checkInactivity, timeToLive * 10000);