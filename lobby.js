firebase.initializeApp(firebaseConfig);

const database = firebase.database();
const ref = database.ref("Countdown");
const ServerValue = firebase.database.ServerValue;
ref.set({
  startAt: ServerValue.TIMESTAMP,
  seconds: 30
});

const serverTimeOffset = 0;
database.ref(".info/serverTimeOffset").on("value", (snapshot) => { serverTimeOffset = snapshot.val() });
ref.on("value", (snapshot) => {
  const seconds = snapshot.val().seconds;
  const startAt = snapshot.val().startAt;
  const interval = setInterval(() => {
    const timeLeft = (seconds * 1000) - (Date.now() - startAt - serverTimeOffset);
    if (timeLeft < 0) {
      clearInterval(interval);
      console.log("0.0 left");
    }
    else {
      console.log(`${Math.floor(timeLeft/1000)}.${timeLeft % 1000}`);
    }
  }, 100)
});

/*
firebase.initializeApp(firebaseConfig);
window.addEventListener('load', joinLobby);
firebase.database().ref('countdown').set(30);

var countdownRef = firebase.database().ref('countdown');
var countdown = 30;

function joinLobby() {
  var timer = document.getElementById('timer');
  
  countdownRef.on('value', function(snapshot) {
    var countdown = snapshot.val();
    timer.textContent = countdown;
  });
}

function decrementCountdown() {
  countdownRef.transaction(function(currentCountdown) {
    if (currentCountdown > 0) {
      return currentCountdown - 1;
    } else {
      // Stop the transaction if countdown reaches 0
      return currentCountdown;
    }
  }, function(error, committed, snapshot) {
    if (error) {
      console.log('Countdown transaction failed:', error);
    } else if (committed) {
      var updatedCountdown = snapshot.val();
      if (updatedCountdown <= 0) {
        clearInterval(interval);
        countdownRef.off();
        var timer = document.getElementById('timer');
        timer.textContent = "Starting game...";
        //window.location.href = "/index.html";
      }
    }
  });
}
var interval = setInterval(decrementCountdown, 1000);*/
