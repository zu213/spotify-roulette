// Import the Express module
const express = require('express');
var bodyParser = require('body-parser')
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const PORT = process.argv[2] || 5000;
const timeToLive = 30
// Create an Express application
const app = express();
let lastActivityTime = Date.now();
const inactivityTimeout = timeToLive * 60 * 1000;
const playerInactivityTimeout = 40 * 1000
const tables = []

var jsonParser = bodyParser.json()
 var urlencodedParser = bodyParser.urlencoded({ extended: false })



function checkInactivity() {
  const currentTime = Date.now();
  console.log(`Time since last message: ${(currentTime - lastActivityTime)/ 1000} seconds`)
  //console.log('current tables ',tables)
  if (currentTime - lastActivityTime >= inactivityTimeout) {
    console.log(`No activity for ${timeToLive} minutes. Terminating server process...`);
    process.exit();  // Terminate the child process
  }
}

function checkPlayers(){
  const currentTime = Date.now();

  for(var tableIndex = 0; tableIndex < tables.length; tableIndex++){
    //console.log(tables[tableIndex].playerIds)
    for(var playerIndex = 0; playerIndex < tables[tableIndex].playerIds.length; playerIndex++){
      if (currentTime - tables[tableIndex].playerIds[playerIndex].lastActivityTime >= playerInactivityTimeout){
        tables[tableIndex].playerIds.splice(playerIndex, 1)
      }
    }
  }
}

app.use(cors());

app.post('/create/:player', jsonParser,(req, res) => {
  var number
  const playerName = req.params.player
  const tracks = req.body
  //console.log(req.body, 'aaab')

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
    const id = uuidv4()
    res.send({message: `Successfully created: code ${number}`, code: number, playerId: id});

    tables.push({song:null, code: number, playerIds: [{tracks: tracks, id: id, lastActivityTime: Date.now(), playerName: playerName}]})
  }else{
    res.send(`Unable to create table :( limit hit`);
  }
});

app.post('/table/:id/:player', (req, res) => {
  const id = req.params.id
  const playerName = req.params.player
  const tracks = req.body
  //console.log(tracks)
  if(id){
    const table = tables.find((table) => table.code == id)
    if(table && playerName){
      const playerId = uuidv4()
      const foundIndex = tables.findIndex(table => table.code == id);
      table.playerIds.push({id: playerId, lastActivityTime: Date.now(), playerName: playerName, tracks: tracks})
      tables[foundIndex] = table;
      res.send({message: `Table ${id} found`, players: table.playerIds, playerId: playerId});
    }else{
      res.send(`Table ${id} not found`);
    }
  }else{
    res.send(`Unable to create table :( limit hit`);
  }
  lastActivityTime  = Date.now()

});

app.get('/table/:id/song/:player', (req, res) => {
  const id = req.params.id
  const playerN = req.params.player

  if(id){
    const table = tables.find((table) => table.code == id)
    if(table){
      const foundIndex = tables.findIndex(table => table.code == id);
      const player = table.playerIds.find((player => player.playerName == playerN))
      console.log(player)
      const userTopTracks = player.tracks
      const j = Math.floor(Math.random() * userTopTracks.length);
      const chosenSong = userTopTracks[j]
      const song = chosenSong
      table.song = song;
      tables[foundIndex] = table;
      res.send({message: `Table ${id} found`});
    }else{
      res.send(`Table ${id} not found`);
    }
  }
  lastActivityTime  = Date.now()

});

app.get('/table/alive/:id/:playerid', (req, res) => {
  const tableCode = req.params.id
  const playerId = req.params.playerid
  const tableIndex = tables.findIndex(table => table.code == tableCode);
  //console.log('why?',tables[tableIndex])
  const playerIndex = tables[tableIndex].playerIds.findIndex(id => id.id == playerId)
  tables[tableIndex].playerIds[playerIndex].lastActivityTime = Date.now()
  res.send({message: `Table ${tableCode} alive message received for player ${playerId}`, players: tables[tableIndex].playerIds, song: tables[tableIndex].song});


});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Start the heartbeat, dies after X mins
setInterval(checkInactivity, timeToLive * 10000);
setInterval(checkPlayers, timeToLive * 1000);