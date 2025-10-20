# 🎶 Spotify Roulette

Basic spotify game, users can create 'tables', which other users can join, then when the table creator starts the game, on the next heartbeat a random players will be selected and one of their top tracks is distributed amongst the table users. The song will be played for each player and song details will slowly be revealed. Players have to guess who the song 'belongs' to, the time at which the guess is recorded for a higher score.

## Game flow:

Below is screenshots fo the game flow,

1. Logging in.
<p float="left">
    <kbd>
        <img src="screenshots/login.png" alt="login" width="300" height="300"/>
    </kbd>
</p>
2. Create a table.
<p float="left">
    <kbd>
        <img src="screenshots/create.png" alt="login" width="300" height="300"/>
    </kbd>
    <kbd>
        <img src="screenshots/table.png" alt="login" width="300" height="300"/>
    </kbd>
</p>
3. Joining existing tables.
<p float="left">
    <kbd>
        <img src="screenshots/join.png" alt="login" width="300" height="300"/>
    </kbd>
    <kbd>
        <img src="screenshots/fulltable.png" alt="login" width="300" height="300"/>
    </kbd>
</p>
4. Starting the game.
<p float="left">
    <kbd>
        <img src="screenshots/loading.png" alt="login" width="300" height="300"/>
    </kbd>
    <kbd>
        <img src="screenshots/guess1.png" alt="login" width="300" height="300"/>
    </kbd>
</p>
5. Playing the game, the details are slowly revealed to aid with guessing while the song plays.
<p float="left">
    <kbd>
        <img src="screenshots/guess2.png" alt="login" width="300" height="300"/>
    </kbd>    
    <kbd>
        <img src="screenshots/guess3.png" alt="login" width="300" height="300"/>
    </kbd>
</p>

## Prerequisites:

- npm
- spotify account

## Setup:

- Start backend by:

  - navigating to server/
  - running 'node index.js'

- Start frontend by:
  - navigating to frontend/
  - running npm install
  - running npm start
  - navigate to localhost:3000
  - Setup client ID

## Use:

- First you will have to log in to spotify, if this is the first time you'll be rerouted to a remote spotify login. Follow the instructions there and, once complete, you'll be returned to the search page.
- From here either create a new table or join an existing one, both conditions need you to enter your name.
- Once created, the table code should be shared with you so that others (only locally) can join, you can join by opening another localhost:3000, if you want to use a different spotify account you'll need to open a private browser or different browser entirely, to have fresh cookies.
- One everyone has joined the table you can start the game by pressing start. On the next heartbeat(every 30 seconds) a round will start
- You'll then have to guess the player the song belongs to in the timelimit.
- That completes the game, after the countdown is up you'll be told the correct answer at the end.
