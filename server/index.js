// Import the Express module
const express = require('express');
var bodyParser = require('body-parser')
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { WebSocketServer } = require('ws');
const http = require('http');
const { table } = require('console');

const PORT = process.argv[2] || 5000;
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
    tables.push({chosenPlayer:null, code: number, playerIds: []})
    return {code: number, index: tables.length - 1}
  } else {
    console.log('limit hit')
  }
}

function broadcastToTable(tableIndex, message) {
  const table = tables[tableIndex];
  if (!table) return;

  const msg = JSON.stringify(message);

  table.playerIds.forEach(player => {
    if (player.ws && player.ws.readyState === 1) {
      player.ws.send(msg);
    }
  });
}

function chooseSong(tableId){
 const table = tables.find((table) => table.code == tableId)
  if(table){
    const i = Math.floor(Math.random() * (table.playerIds.length ?? 1));
    const chosenPlayer = table.playerIds[i]
    const userTopTracks = chosenPlayer.tracks
    const j = Math.floor(Math.random() * (userTopTracks.length ?? 1));
    const chosenSong = userTopTracks[j]
    return {chosenSong, chosenPlayer}
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

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.replace('/?', ''));
  const playerName = params.get('playername');
  var tableCode = params.get('tableid');
  var playerId
  var tableIndex
  var playerIndex

  if(tableCode){
    // if given a table code the table alreayd exists
    tableIndex = tables.findIndex(t => t.code == tableCode);
  } else {
    // otherwise make a table
    const tableInfo = createTable()  
    tableCode = tableInfo.code
    tableIndex = tableInfo.index
  }

  if (!tableIndex) return ws.close();

  lastActivityTime = Date.now()

  //player.ws = ws;
  //player.lastActivityTime = Date.now();
  console.log(`Player ${playerName} connected to table ${tableCode}`);

  ws.on('message', msg => {
    try {
      const data = JSON.parse(msg);
      console.log(data.type)

      // always needs fresh index in case things change
      tableIndex = tables.findIndex(t => t.code == tableCode);
      playerIndex = tables[tableIndex].playerIds.findIndex(p => p.id == playerId)

      switch (data.type) {
        case 'submit_tracks':
          // Add the player relating to thsi websocker
          playerId = uuidv4()
          tables[tableIndex].playerIds.push({tracks: data.tracks, id: playerId, lastActivityTime: Date.now(), playerName: playerName, ws, score: 0, playingGame: false})
          playerIndex = tables[tableIndex].playerIds.length - 1
          const scores = tables[tableIndex].playerIds.map(player => ({playerName: player['playerName'], score: player['score']}))
          broadcastToTable(tableIndex, {type: 'table_info', tableCode, players: tables[tableIndex].playerIds, scores})
          break;

        case 'ping':
          if(playerId == null || tableCode == null || playerIndex == null || tableIndex == null) return
          if(tableIndex < 0 || !tables[tableIndex]) {
            ws.send(JSON.stringify({type: 'no_table', message: 'invalid table'}))
            return
          }
          console.log(`Ping for ${playerId}`)
          tables[tableIndex].playerIds[playerIndex]['lastActivityTime'] = Date.now()
          ws.send(JSON.stringify({type: 'pong', message: `Table ${tableCode} alive message received for player ${playerId}`}));
          break;

        case 'start_round':
          //, players: tables[tableIndex].playerIds, song: tables[tableIndex].song, chosenPlayer: tables[tableIndex].chosenPlayer }
          // Pick player and song
          const {chosenSong, chosenPlayer} = chooseSong(tableCode)
          tables[tableIndex].chosenPlayer = chosenPlayer
          broadcastToTable(tableIndex, {type:'start_round', song: chosenSong})
          for(let i = 0; i<tables[tableIndex].playerIds.length; i++){
            tables[tableIndex].playerIds[i].playingGame = true
          }
          break;

        case 'guess_made':
          tables[tableIndex].playerIds[playerIndex].playingGame = false

          const answerPlayer = tables[tableIndex].chosenPlayer
          if(answerPlayer.id == data['playerId']) tables[tableIndex].playerIds[playerIndex].score += 1

          var gameInPlay = false
          for(let i = 0; i<tables[tableIndex].playerIds.length; i++){
            if(tables[tableIndex].playerIds[i].playingGame == true) {
              gameInPlay = true
            }
          }

          if(!gameInPlay){
            // broadcast on the last player to guess
            const { tracks, ws, ...strippedPlayer} = answerPlayer
            const scores = tables[tableIndex].playerIds.map(player => ({playerName: player['playerName'], score: player['score']}))
            broadcastToTable(tableIndex, {type:'show_leaderboard', answer: strippedPlayer, scores})
          }

          break

        default:
          ws.send(JSON.stringify({ error: 'Unknown message type' }));
      }

    } catch (err) {
      console.error('Invalid message:', err);
      ws.send(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });

  ws.on('close', () => {
    // if mising data it will be cleaned up by gc
    if(!tableIndex || !playerIndex) return
    console.log(`Player ${playerId} disconnected`);
    tables[tableIndex].playerIds.splice(playerIndex, 1)
  });
});

server.listen(PORT, () => {
  console.log(`HTTP + WS server running on http://localhost:${PORT}`);
});

// Start the heartbeat, dies after X mins
setInterval(checkInactivity, timeToLive * 10000);
setInterval(checkPlayers, timeToLive * 1000);