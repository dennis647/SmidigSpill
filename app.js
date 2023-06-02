const mapData = {
  minX: 1,
  maxX: 14,
  minY: 4,
  maxY: 12,
  returnPoint:"7x4",
  blockedSpaces: {
    "1x11": true,
    "12x10": true,
    "4x7": true,
    "5x7": true,
    "6x7": true,
    "8x6": true,
    "9x6": true,
    "10x6": true,
    "7x9": true,
    "8x9": true,
    "9x9": true,
  },
};

// Sound-fx and music
const music = new Audio('/music/smooth-groove-10312.mp3');
const caching = new Audio('/sounds/caching.mp3');
const moveFx = new Audio('/sounds/move.mp3');
const pushFx = new Audio('/sounds/whoosh.mp3');
const dashFx = new Audio('/sounds/dash.mp3');
const muteCheckbox = document.getElementById("musicToggle");

// Options for Player Colors... these are in the same order as our sprite sheet
const playerColors = ["blue", "red", "orange", "yellow", "green", "purple"];

//Misc Helpers
function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}
function getKeyString(x, y) {
  return `${x}x${y}`;
}

function createName() {
  const nameGen = randomFromArray([
    "EDVARD",
    "MUNCH",
    "EDVARD MUNCH",
    "SKRIK",
    "VAMPYR",
    "ANGST",
    "LØSRIVELSE",
    "STJERNENATT",
    "STRAND",
    "RØDT OG HVITT",
    "SJALSUI",
    "TOGRØYK",
  ]);

  return `${nameGen}`;
}

function isSolid(x,y) {

  const blockedNextSpace = mapData.blockedSpaces[getKeyString(x, y)];
  return (
    blockedNextSpace || 
    x >= mapData.maxX ||
    x < mapData.minX ||
    y >= mapData.maxY ||
    y < mapData.minY
  )
}

function getRandomSafeSpot() {
  //We don't look things up by key here, so just return an x/y
  return randomFromArray([
    { x: 1, y: 4 },
    { x: 2, y: 4 },
    { x: 1, y: 5 },
    { x: 2, y: 6 },
    { x: 2, y: 8 },
    { x: 2, y: 9 },
    { x: 4, y: 8 },
    { x: 5, y: 5 },
    { x: 5, y: 8 },
    { x: 5, y: 10 },
    { x: 5, y: 11 },
    { x: 11, y: 7 },
    { x: 12, y: 7 },
    { x: 13, y: 7 },
    { x: 13, y: 6 },
    { x: 13, y: 8 },
    { x: 7, y: 6 },
    { x: 7, y: 7 },
    { x: 7, y: 8 },
    { x: 8, y: 8 },
    { x: 10, y: 8 },
    { x: 8, y: 8 },
    { x: 11, y: 4 },
  ]);
}






(function () {

  let playerId;
  let playerRef;
  let players = {};
  let playerElements = {};
  let coins = {};
  let coinElements = {};
  let sum = 0;
  let allPlayersRef = {};

  
  const gameContainer = document.querySelector(".game-container");
  const playerNameInput = document.querySelector("#player-name");
  const playerColorButton = document.querySelector("#player-color");

  function placeCoin() {
    const coinSpawnPoints = [
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 1, y: 5 },
      { x: 2, y: 6 },
      { x: 2, y: 8 },
      { x: 2, y: 9 },
      { x: 4, y: 8 },
      { x: 5, y: 5 },
      { x: 5, y: 8 },
      { x: 5, y: 10 },
      { x: 5, y: 11 },
      { x: 11, y: 7 },
      { x: 12, y: 7 },
      { x: 13, y: 7 },
      { x: 13, y: 6 },
      { x: 13, y: 8 },
      { x: 7, y: 6 },
      { x: 7, y: 7 },
      { x: 7, y: 8 },
      { x: 8, y: 8 },
      { x: 10, y: 8 },
      { x: 8, y: 8 },
      { x: 11, y: 4 },
    ];
  
    coinSpawnPoints.forEach((point) => {
      const key = getKeyString(point.x, point.y);
      if (!coins[key]) {
        const coinRef = firebase.database().ref(`coins/${key}`);
        coinRef.set({
          x: point.x,
          y: point.y,
        });
      }
    });
  }
  
  function removeCoins() {
    const allCoinsRef = firebase.database().ref(`coins`);
    allCoinsRef.once("value", (snapshot) => {
      const coins = snapshot.val() || {};
      Object.keys(coins).forEach((key) => {
        firebase.database().ref(`coins/${key}`).remove();
      });
    });
  }


  function attemptGrabCoin(x, y) {
    
    const key = getKeyString(x, y);
    const errorMsg = document.getElementById("errorMsg");

    if (coins[key]) {
      if (players[playerId].coins <= 2) {
      const pickupFx = new Audio('/Sounds/paper.mp3');
      pickupFx.play();
      // Remove this key from data, then uptick Player's coin count
      firebase.database().ref(`coins/${key}`).remove();
      playerRef.update({
        coins: players[playerId].coins + 1,
      })
    } else {
    errorMsg.style.display = `block`;
    errorMsg.innerHTML = `Du har nådd maks antall bilder du kan bære!`;
    setTimeout(() => {
      errorMsg.style.display = `none`;
    }, 1500);
  }
  } 
  }
  function attemptReturn(x, y){
    const key = getKeyString(x,y);
    if(mapData.returnPoint == key){
      if(players[playerId].coins >= 1){
        caching.play();
      }
      console.log("Painting(s) saved!");
      const paintingsCollected = document.getElementById("collected-paintings");
      sum += players[playerId].coins;
      paintingsCollected.innerHTML = `Stolen Paintings: ${sum}`
      playerRef.update({
        coins: players[playerId].coins = 0,
        collectedPaintings: players[playerId].collectedPaintings = sum,
      })
    }
  }

  /*
  function checkCollision(player1, player2){
    return player1.x === player2.x && player1.y === player2.y
  
}*/

  function handleArrowPress(xChange=0, yChange=0) {
    const newX = players[playerId].x + xChange;
    const newY = players[playerId].y + yChange;
    

    let collisionDetected = false;
    Object.keys(players).forEach((key) => {
      if (key !== playerId) {
        const otherPlayer = players[key];
        if (otherPlayer.x === newX && otherPlayer.y === newY){
          collisionDetected = true;
          pushedPlayerId = key
          console.log("Collision detected with player ", key);
          pushFx.play();
          const redFlash = document.getElementById("red-Flash");  
          redFlash.style.display = 'block';
          setTimeout(() => {
          redFlash.style.display = 'none';
          }, 200);
          

          if(players[pushedPlayerId].coins >= 1) {
          firebase.database().ref(`players/${pushedPlayerId}`).update({
            coins: players[pushedPlayerId].coins -= 1, collisionDetected: true})
            if(players[pushedPlayerId].coins >= 0) {
            playerRef.update({
              coins: players[playerId].coins + 1,
            })
          } else {
            return;
          }

        }
      }
      }
    });

    if ( !collisionDetected && !isSolid(newX, newY)) {
      //move to the next space
      players[playerId].x = newX;
      players[playerId].y = newY;
      moveFx.play();
      if (xChange === 1) {
        players[playerId].direction = "right";
      }
      else if (xChange === -1) {
        players[playerId].direction = "left";
      }
      playerRef.set(players[playerId]);
      attemptGrabCoin(newX, newY);
      attemptReturn(newX,newY);
      
      // Adjust viewport position based on character's position
      const viewport = document.querySelector(".viewport");
      const cellSize = 128; // Adjust this value according to your game grid cell size

      const viewportLeft = players[playerId].x * cellSize;
      const viewportTop = players[playerId].y * cellSize;
       // Add animation transition to the viewport
      viewport.style.transition = "left 0.5s ease, top 0.5s ease";
      viewport.style.left = `${-viewportLeft}px`;
      viewport.style.top = `${-viewportTop}px`;

      // Remove animation transition after it finishes
      setTimeout(() => {
        viewport.style.transition = "";
      }, 500);
    } else{
      console.log("Cannot move to position:", newX, newY)
    }
  }

  window.onload = function() {
     setTimeout(
      function() {

    const viewport = document.querySelector(".viewport");
    const cellSize = 128; // Adjust this value according to your game grid cell size
    const viewportLeft = players[playerId].x * cellSize;
    const viewportTop = players[playerId].y * cellSize;
      viewport.style.left = `${-viewportLeft}px`;
      viewport.style.top = `${-viewportTop}px`;
      }, 850)
  }
  
  // INIT GAME //
  function initGame() {
    music.muted = false;
    muteCheckbox.addEventListener('change', function() {
      if (muteCheckbox.checked) {
        music.muted = true;
      } else {
        music.muted = false;
        music.play();
      }
    });

    let spacePressed = false;
    let lastSpacePressTime = 0;
    let actionPerformed = false;
    const pressCooldown = 5000;

    new KeyPressListener("Space", () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - lastSpacePressTime;
      
      if (!spacePressed && elapsedTime >= pressCooldown) {
        spacePressed = true;
        lastSpacePressTime = currentTime;
      }
    });

    new KeyPressListener("ArrowDown", () => {
      if (spacePressed === false) {
      handleArrowPress(0, 1)
      } if (spacePressed === true || !spacePressed && pressCooldown === 0) {
        dashFx.play();
        handleArrowPress(0, 2);
        spacePressed = false;

    }
  });

    new KeyPressListener("ArrowLeft", () => {
    if (spacePressed === false) {
      handleArrowPress(-1, 0);
    } if (spacePressed === true || !spacePressed && pressCooldown === 0) {
      dashFx.play();
      handleArrowPress(-3, 0);
      spacePressed = false;
    }
  });

    new KeyPressListener("ArrowRight", () => {
      if (spacePressed === false) {
        handleArrowPress(1, 0);
        spacePressed = false;
      } if (spacePressed === true || !spacePressed && pressCooldown === 0) {
        dashFx.play();
        handleArrowPress(3, 0);
        spacePressed = false;
    }
  });

    new KeyPressListener("ArrowUp", () => {
      if (spacePressed === false) {
        handleArrowPress(0, -1);
      } if (spacePressed === true || !spacePressed && pressCooldown === 0) {
        dashFx.play();
        handleArrowPress(0, -3);
        spacePressed = false;
      }
    });

    function updateCooldownDisplay() {
      const currentTime = Date.now();
      const elapsedTime = currentTime - lastSpacePressTime;
      const remainingTime = pressCooldown - elapsedTime;
      const powerupCooldown = document.getElementById("powerup-cooldown");
      
      const seconds = Math.ceil(remainingTime / 1000); // Convert to seconds and round up
      
      if (seconds > 0) {
        powerupCooldown.innerHTML = (`Powerup cooldown: ${seconds}s`);
        powerupCooldown.style.background = `#9a240a`;
        // Update the UI or perform any desired actions with the remaining time
      } else if (seconds <= 1) {
        powerupCooldown.innerHTML = (`Powerup is ready!`);
        powerupCooldown.style.background = `#fe390f`;
      }
    }
    
    setInterval(updateCooldownDisplay, 1000);
    

    const allPlayersRef = firebase.database().ref(`players`);
    const allCoinsRef = firebase.database().ref(`coins`);

    function updateScoreboard() {
      const scoreboardBody = document.getElementById("scoreboard-body");
      scoreboardBody.innerHTML = ""; // Clear existing scores
    
      const sortedPlayers = Object.values(players).sort((a, b) => b.collectedPaintings - a.collectedPaintings);
    
      sortedPlayers.forEach((player) => {
        const row = document.createElement("tr");
        const playerScoreCell = document.createElement("td");
    
        playerScoreCell.textContent = player.name.toUpperCase() + ":  " + " "+ player.collectedPaintings;
        playerScoreCell.classList.add("player-score");
    
        row.appendChild(playerScoreCell);
        scoreboardBody.appendChild(row);
      });
    }
    allPlayersRef.on("value", (snapshot) => {
      //Fires whenever a change occurs
      players = snapshot.val() || {};
      Object.keys(players).forEach((key) => {
        const characterState = players[key];
        let el = playerElements[key];
        // Now update the DOM
        el.querySelector(".Character_name").innerText = characterState.name;
        el.querySelector(".Character_coins").innerText = characterState.coins;
        el.setAttribute("data-color", characterState.color);
        el.setAttribute("data-direction", characterState.direction);
        const left = 16 * characterState.x + "px";
        const top = 16 * characterState.y - 4 + "px";
        el.style.transform = `translate3d(${left}, ${top}, 0)`;  
        updateScoreboard()  
      })
    })
    allPlayersRef.on("child_added", (snapshot) => {
      //Fires whenever a new node is added the tree
      const addedPlayer = snapshot.val();
      const characterElement = document.createElement("div");
      characterElement.classList.add("Character", "grid-cell");
      if (addedPlayer.id === playerId) {
        characterElement.classList.add("you");
      }
      characterElement.innerHTML = (`
        <div class="Character_shadow grid-cell"></div>
        <div class="Character_sprite grid-cell"></div>
        <div class="Character_name-container">
          <span class="Character_name"></span>
          <span class="Character_coins">0</span>
        </div>
        <div class="Character_you-arrow"></div>
      `);
      playerElements[addedPlayer.id] = characterElement;

      //Fill in some initial state
      characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
      characterElement.querySelector(".Character_coins").innerText = addedPlayer.coins;
      characterElement.setAttribute("data-color", addedPlayer.color);
      characterElement.setAttribute("data-direction", addedPlayer.direction);
      const left = 16 * addedPlayer.x + "px";
      const top = 16 * addedPlayer.y - 4 + "px";
      characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
      gameContainer.appendChild(characterElement);
    })


    //Remove character DOM element after they leave
    allPlayersRef.on("child_removed", (snapshot) => {
      const removedKey = snapshot.val().id;
      gameContainer.removeChild(playerElements[removedKey]);
      delete playerElements[removedKey];
    })


    //This block will remove coins from local state when Firebase `coins` value updates
    allCoinsRef.on("value", (snapshot) => {
      coins = snapshot.val() || {};
    });
    //

    allCoinsRef.on("child_added", (snapshot) => {
      const coin = snapshot.val();
      const key = getKeyString(coin.x, coin.y);
      coins[key] = true;

      const coinSprites = [
        "/images/art1.png",
        "/images/art2.png",
        "/images/art5.png",
        "/images/art6.png",
        "/images/art7.png",
        "/images/art8.png",
        "/images/art9.png",
        "/images/art10.png",
        "/images/art11.png",
        "/images/art12.png",
        "/images/art13.png",
        "/images/art14.png",
        "/images/art15.png",
        // Add more PNG image paths or URLs as needed
      ];
    
    const randomIndex = Math.floor(Math.random() * coinSprites.length);
    const selectedCoinSprite = coinSprites[randomIndex];

      // Create the DOM Element
      const coinElement = document.createElement("div");
      coinElement.classList.add("Coin", "grid-cell");
      coinElement.innerHTML = `
        <div class="Coin_shadow grid-cell"></div>
        <img src="${selectedCoinSprite}" class="Coin_sprite grid-cell"/>
      `;

      // Position the Element
      const left = 16 * coin.x + "px";
      const top = 16 * coin.y - 4 + "px";
      coinElement.style.transform = `translate3d(${left}, ${top}, 0)`;

      // Keep a reference for removal later and add to DOM
      coinElements[key] = coinElement;
      gameContainer.appendChild(coinElement);
    })
    allCoinsRef.on("child_removed", (snapshot) => {
      const {x,y} = snapshot.val();
      const keyToRemove = getKeyString(x,y);
      gameContainer.removeChild( coinElements[keyToRemove] );
      delete coinElements[keyToRemove];
    })


    //Updates player name with text input
    playerNameInput.addEventListener("change", (e) => {
      const newName = e.target.value || createName();
      playerNameInput.value = newName;
      playerRef.update({
        name: newName
      })
    })

    allPlayersRef.on("child_changed", (snapshot) => {
      const changedPlayer = snapshot.val();
      if (changedPlayer.id === playerId && changedPlayer.collisionDetected) {
        // Perform red flash on the current player's client
        const redFlash = document.getElementById("red-Flash");
        redFlash.style.display = "block";
        const collisionSound = new Audio('/sounds/Oof.mp3');
        collisionSound.play();
        setTimeout(() => {
          redFlash.style.display = "none";
        }, 200);
    
        // Reset the collisionDetected flag
        playerRef.update({
          collisionDetected: false,
        });
      }
    });

    //Update player color on button click
    playerColorButton.addEventListener("click", () => {
      const mySkinIndex = playerColors.indexOf(players[playerId].color);
      const nextColor = playerColors[mySkinIndex + 1] || playerColors[0];
      playerRef.update({
        color: nextColor
      })
    })

    //Place my first coin
    //placeCoin();
    allCoinsRef.once("value", (snapshot) => {
      const coinsExist = snapshot.exists();
      if (!coinsExist || Object.keys(players).length === 1) {
        // No coins exist, so we can place them
        placeCoin();
      }
    });

    allPlayersRef.on("value", (snapshot) => {
      const players = snapshot.val() || {};
      if (Object.keys(players).length === 0) {
        removeCoins();
      }
    });
    window.addEventListener("keydown", function(e) {
      if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
          e.preventDefault();
      }
  }, false);

    /*function updateCamera(pX, pY){
      const width = gameContainer.offsetWidth;
      const height = gameContainer.offsetHeight;
      const camX = pX;
      const camY = pY;
      gameContainer.style.transform = `translate3d(${-camX}px, ${-camY}px, 0)`;
      /*CamX = x;
      CamY = y;
      gameContainer.style.transform = `translate3d(${camX}px, ${camY}px, 0)`;
    }
    setInterval(updateCamera(playerRef.x , playerRef.y), 100);*/
  }

  firebase.auth().onAuthStateChanged((user) => {
    console.log(user)
    if (user) {
      //You're logged in!
      playerId = user.uid;
      playerRef = firebase.database().ref(`players/${playerId}`);

      const name = createName();
      playerNameInput.value = name;

      const {x, y} = getRandomSafeSpot();


      playerRef.set({
        id: playerId,
        name,
        direction: "right",
        color: randomFromArray(playerColors),
        x,
        y,
        coins: 0,
        collectedPaintings: 0,
      })

      //Remove me from Firebase when I diconnect
      playerRef.onDisconnect().remove();

      //Begin the game now that we are signed in
      initGame();
    } else {
      //You're logged out.
    }
  })

  firebase.auth().signInAnonymously().catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    // ...
    console.log(errorCode, errorMessage);
  });


})();
