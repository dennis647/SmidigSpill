function joinLobby() {
  var countdown = 30;
  var timer = document.getElementById('timer');
  
  var interval = setInterval(function() {
    countdown--;
    timer.textContent = countdown;
    
    if (countdown <= 0) {
      clearInterval(interval);
      timer.textContent = "Starting game...";
      window.location.href = "/index.html";
    }
  }, 1000);
}

window.addEventListener('load', joinLobby);
