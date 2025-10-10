// Import the Express module
const express = require('express');
var bodyParser = require('body-parser')
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { WebSocketServer } = require('ws');
const http = require('http');

const PORT = process.argv[2] || 5000;
const PORT2 = process.argv[3] || 5001;
const timeToLive = 30
// Create an Express application
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let lastActivityTime = Date.now();
const inactivityTimeout = timeToLive * 60 * 1000;
const playerInactivityTimeout = 40 * 1000
const tables = []

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

function checkInactivity() {
  const currentTime = Date.now();
  console.log(`Time since last message: ${(currentTime - lastActivityTime)/ 1000} seconds`)
  if (currentTime - lastActivityTime >= inactivityTimeout) {
    console.log(`No activity for ${timeToLive} minutes. Terminating server process...`);
    process.exit();  // Terminate the child process
  }
}

function checkPlayers(){
  const currentTime = Date.now();

  for(var tableIndex = 0; tableIndex < tables.length; tableIndex++){
    for(var playerIndex = 0; playerIndex < tables[tableIndex].playerIds.length; playerIndex++){
      if (currentTime - tables[tableIndex].playerIds[playerIndex].lastActivityTime >= playerInactivityTimeout){
        tables[tableIndex].playerIds.splice(playerIndex, 1)
      }
    }
  }
}

function createTable(){
  var number

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
    tables.push({song:null, chosenPlayer:null, code: number, playerIds: []})
    return {code: number, index: tables.length - 1}
  }else{
    console.log('limit hit')
  }
}

app.get('/table/:id' , (req, res) => {
  const table = tables.find(e => e.code == req.params.id)
  if(table) {
    return res.send({table})
  } else {
    return res.status(404).send(`Table not found`)
  }
})

// Create new table with one player
app.post('/create/:player', jsonParser,(req, res) => {
  var number
  const playerName = req.params.player
  const tracks = req.body

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

    tables.push({song:null, chosenPlayer:null, code: number, playerIds: [{tracks: tracks, id: id, lastActivityTime: Date.now(), playerName: playerName}]})
  }else{
    res.send(`Unable to create table :( limit hit`);
  }
});

// add users to existing table
app.post('/table/:id/:player', jsonParser,(req, res) => {
  const id = req.params.id
  const playerName = req.params.player
  const tracks = req.body
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

// choose a player to play a song from
app.get('/table/:id/song/:player', (req, res) => {
  const id = req.params.id
  const playerN = req.params.player

  if(id){
    const table = tables.find((table) => table.code == id)
    if(table){
      const foundIndex = tables.findIndex(table => table.code == id);
      const player = table.playerIds.find((player => player.playerName == playerN))
      table.chosenPlayer = player.playerName
      const userTopTracks = player.tracks
      const j = Math.floor(Math.random() * (userTopTracks.length ?? 1));
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

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.replace('/?', ''));
  const tableCode = params.get('tableid');
  const playerName = params.get('playername');
  var code


  var tableIndex
  if(tableCode){
    tableIndex = tables.findIndex(t => t.code == tableCode);
    if (!tableIndex) return ws.close();
  } else {
    // make a table
    code, tableIndex = createTable()    
  }

  //player.ws = ws;
  //player.lastActivityTime = Date.now();
  console.log(`Player ${playerName} connected to table ${tableCode}`);

  ws.on('message', msg => {
    try {
      const data = JSON.parse(msg);

      switch (data.type) {
        case 'submit_tracks':
          // Equivalent to your POST /table route
          if(tableCode){
            tableIndex = tables.indexOf(t => t.code == tableCode);
            if (!tableIndex) return ws.close();
          } else {
            // make a table
            let tableResponse = createTable()
            code = tableResponse['code']
            tableIndex = tableResponse['index']
          }
          const id = uuidv4()
          tables[tableIndex].playerIds.push({tracks: tracks, id: id, lastActivityTime: Date.now(), playerName: playerName})

          ws.send(JSON.stringify({type: 'table_info', id, code}))
          break;
              

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
          break;

        default:
          ws.send(JSON.stringify({ error: 'Unknown message type' }));
      }

    } catch (err) {
      console.error('Invalid message:', err);
      ws.send(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });

  ws.on('close', () => {
    console.log(`Player ${playerId} disconnected`);
    player.lastActivityTime = 0; // mark inactive
  });
});

app.get('/table/alive/:id/:playerid', (req, res) => {
  const tableCode = req.params.id
  const playerId = req.params.playerid
  const tableIndex = tables.findIndex(table => table.code == tableCode);
  if(tableIndex < 0 || !tables[tableIndex]) res.send({message: 'invalid table'})
  const playerIndex = tables[tableIndex].playerIds.findIndex(id => id.id == playerId)
  tables[tableIndex].playerIds[playerIndex]['lastActivityTime'] = Date.now()
  res.send({message: `Table ${tableCode} alive message received for player ${playerId}`, players: tables[tableIndex].playerIds, song: tables[tableIndex].song, chosenPlayer: tables[tableIndex].chosenPlayer });
});




//app.listen(PORT, () => {
//  console.log(`Server is running on http://localhost:${PORT}`);
//});

server.listen(PORT, () => {
  console.log(`HTTP + WS server running on http://localhost:${PORT2}`);
});

// Start the heartbeat, dies after X mins
setInterval(checkInactivity, timeToLive * 10000);
setInterval(checkPlayers, timeToLive * 1000);