const stages = [
  ["Mindfully, I will breathe in","Mindfully, I will breathe out"],
  ["Breathing in long, I know I breathe in long","Breathing out long, I know I breathe out long"],
  ["Breathing in short, I know I breathe in short","Breathing out short, I know I breathe out short"],
  ["Experiencing the whole body, I will breathe in","Experiencing the whole body, I will breathe out"],
  ["Calming bodily fabrication, I will breathe in","Calming bodily fabrication, I will breathe out"],
  ["Experiencing rapture, I will breathe in","Experiencing rapture, I will breathe out"],
  ["Experiencing pleasure, I will breathe in","Experiencing pleasure, I will breathe out"],
  ["Experiencing mental fabrication, I will breathe in","Experiencing mental fabrication, I will breathe out"],
  ["Calming mental fabrication, I will breathe in","Calming mental fabrication, I will breathe out"],
  ["Experiencing the mind, I will breathe in" , "Experiencing the mind, I will breathe out"],
  ["Experiencing mental fabrication, I will breathe in","Experiencing mental fabrication, I will breathe out"],
  ["Gladdening the mind, I will breathe in","Gladdening the mind, I will breathe out"],
  ["Concentrating the mind, I will breathe in", "Concentrating the mind, I will breathe out"], 
  ["Liberating the mind, I will breathe in","Liberating the mind, I will breathe out"],
  ["Contemplating impermanence, I will breathe in", "Contemplating impermanence, I will breathe out"],
  ["Contemplating dispassion, I will breathe in","Contemplating dispassion, I will breathe out"],
  ["Contemplating cessation, I will breathe in","Contemplating cessation, I will breathe out"],
  ["Contemplating relinquishment, I will breathe in" , "Contemplating relinquishment, I will breathe out"] 
];


// State variables
let running = false;
let stageIndex = 0;
let breathPhase = 0; // 0: In, 1: Out
let breathCycle = localStorage.getItem("breathCycle") ? parseInt(localStorage.getItem("breathCycle")) : 10;
let bellInterval = localStorage.getItem("bellInterval") ? parseInt(localStorage.getItem("bellInterval")) : 60; // seconds
let bellCountdown = bellInterval;

// Timers
let breathTimer;
let bellTimer;

// UI Elements
const mainText = document.getElementById("main-text");
const stageIndicator = document.getElementById("stage-indicator");
const circle = document.getElementById("circle");
const toggleBtn = document.getElementById("toggleBtn");
const timerEl = document.getElementById("timer");
const bell = document.getElementById("bell");
const bellPopup = document.getElementById("bellPopup");
const savedSound = localStorage.getItem("bellSound");
if (savedSound) {
  bell.src = `./audio/${savedSound}.mp3`;
}
const speedPopup = document.getElementById("speedPopup");
const overlay = document.getElementById("overlay");

// Init
circle.style.animationDuration = breathCycle + "s";
circle.style.animationPlayState = "paused";
timerEl.textContent = formatTime(bellCountdown);

function formatTime(s) {
  const m = Math.floor(s/60);
  const sec = s%60;
  return (m>0?m+":":"") + (sec<10?"0":"") + sec;
}

function playBell() {
  bell.currentTime=0; bell.play().catch(()=>{});
}

function updateText(immediate = false) {
  const line = stages[stageIndex][breathPhase];
  const stepName = ` ${stageIndex + 1} / ${stages.length}`;
  
  stageIndicator.textContent = stepName;
  
  if(immediate){
     mainText.textContent = line;
     mainText.style.opacity = 1;
  } else {
     mainText.style.opacity = 0;
     setTimeout(() => {
       mainText.textContent = line;
       mainText.style.opacity = 1;
     }, 500);
  }
}

function startBreathLoop() {
  clearInterval(breathTimer);
  const halfTime = (breathCycle * 1000) / 2;
  
  breathTimer = setInterval(() => {
    if(running){
      breathPhase = (breathPhase + 1) % 2; // Toggle 0 & 1
      updateText();
    }
  }, halfTime);
}

function start() {
  if (running) return;
  running = true;

  toggleBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
      <rect x="12" y="10" width="5" height="20" fill="white"/>
      <rect x="23" y="10" width="5" height="20" fill="white"/>
    </svg>
  `;
  toggleBtn.style.color = "#fff";

  circle.style.animationPlayState = "running";
  updateText(true);
  startBreathLoop();

  // Resume bell timer
  clearInterval(bellTimer);
  bellTimer = setInterval(() => {
    bellCountdown--;
    timerEl.textContent = formatTime(bellCountdown);
    if (bellCountdown <= 0) {
      playBell();
      bellCountdown = bellInterval;
    }
  }, 1000);

  // If starting from the very beginning (countdown still at full interval), play initial bell
  if (bellCountdown === bellInterval) {
    playBell();
  }
}



function pause() {
  running = false;
  toggleBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
      <polygon points="14,10 30,20 14,30" fill="white"/>
    </svg>
  `;
  toggleBtn.style.color = "#8ac";

  circle.style.animationPlayState = "paused";

  // Stop timers
  clearInterval(breathTimer);
  clearInterval(bellTimer);

  // Stop any bell sound immediately
  bell.pause();
  bell.currentTime = 0;

  // IMPORTANT: do NOT reset bellCountdown here
  // Leave timerEl showing the remaining time so it can resume later
}



// Logic Chuyển Stage thủ công
function changeStage(direction) {
  const newIndex = stageIndex + direction;
  if (newIndex >= 0 && newIndex < stages.length) {
    stageIndex = newIndex;
    breathPhase = 0;

    updateText(true);

    // Reset animation if running
    if (running) {
      circle.style.animation = 'none';
      circle.offsetHeight; // trigger reflow
      circle.style.animation = `breathe ${breathCycle}s ease-in-out infinite`;
      startBreathLoop();
    }

    // Reset bell timer + countdown ALWAYS (paused or running)
    clearInterval(bellTimer);
    bellCountdown = bellInterval;
    timerEl.textContent = formatTime(bellCountdown);

    if (running) {
      bellTimer = setInterval(() => {
        bellCountdown--;
        timerEl.textContent = formatTime(bellCountdown);
        if (bellCountdown <= 0) {
          playBell();
          bellCountdown = bellInterval;
        }
      }, 1000);

      // Play bell immediately when stage changes if running
      playBell();
    }
  }
}



// --- Event Listeners ---
toggleBtn.addEventListener("click", () => running ? pause() : start());

document.getElementById("bellBtn").addEventListener("click", () => {
  closeAllPopups(); 
  bellPopup.style.display="flex"; 
  overlay.style.display="block";

  document.querySelectorAll("#bellPopup button").forEach(btn => btn.classList.remove("active"));

  const savedInterval = localStorage.getItem("bellInterval");
  const savedCustom = localStorage.getItem("bellCustom");

  if (savedCustom && savedCustom !== "") {
    document.getElementById("customMin").value = savedCustom;
  } else if (savedInterval) {
    const minutes = parseInt(savedInterval) / 60;
    document.querySelectorAll("#bellPopup button").forEach(btn => {
      if (btn.dataset.min && parseInt(btn.dataset.min) === minutes) {
        btn.classList.add("active");
      }
    });
  }
});
document.getElementById("speedBtn").addEventListener("click", () => {
  closeAllPopups(); 
  speedPopup.style.display = "flex"; 
  overlay.style.display = "block";

  document.querySelectorAll("#speedPopup button").forEach(btn => btn.classList.remove("active"));

  const savedSpeed = localStorage.getItem("breathCycle");
  const savedCustom = localStorage.getItem("speedCustom");

  if (savedCustom && savedCustom !== "") {
    document.getElementById("customSpeed").value = savedCustom;
  } else if (savedSpeed) {
    const seconds = parseInt(savedSpeed);
    document.querySelectorAll("#speedPopup button").forEach(btn => {
      if (btn.dataset.speed && parseInt(btn.dataset.speed) === seconds) {
        btn.classList.add("active");
      }
    });
  }
});


const bellSoundPopup = document.getElementById("bellSoundPopup");
let bellSound = localStorage.getItem("bellSound") || "bell-1";

function setBellSound(name) {
  bellSound = name;
  localStorage.setItem("bellSound", name);

  document.querySelectorAll("#bellSoundPopup button[data-sound]").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll("#bellSoundPopup button[data-sound]").forEach(btn => {
    if (btn.dataset.sound === name) btn.classList.add("active");
  });

  bell.src = `./audio/${name}.mp3`;
  bell.currentTime = 0;
  bell.play().catch(()=>{});
}

document.getElementById("bellBtn").addEventListener("click", () => {
  closeAllPopups();
  bellSoundPopup.style.display = "flex";
  overlay.style.display = "block";

  document.querySelectorAll("#bellSoundPopup button[data-sound]").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll("#bellSoundPopup button[data-sound]").forEach(btn => {
    if (btn.dataset.sound === bellSound) btn.classList.add("active");
  });
});

document.getElementById("timer").addEventListener("click", () => {
  closeAllPopups();
  bellPopup.style.display = "flex";
  overlay.style.display = "block";
  // restore interval selection…
});

function closeAllPopups() {
  bellPopup.style.display = "none";       // interval popup
  bellSoundPopup.style.display = "none";  // new sound popup
  speedPopup.style.display = "none";
  overlay.style.display = "none";
}


function saveInterval(m) {
  bellInterval = m * 60;
  localStorage.setItem("bellInterval", bellInterval);
  localStorage.setItem("bellCustom", ""); // clear custom if preset chosen
  bellCountdown = bellInterval;
  timerEl.textContent = formatTime(bellCountdown);

  // Reset bell timer if running
  if (running) {
    clearInterval(bellTimer);
    bellTimer = setInterval(() => {
      bellCountdown--;
      timerEl.textContent = formatTime(bellCountdown);
      if (bellCountdown <= 0) {
        playBell();
        bellCountdown = bellInterval;
      }
    }, 1000);

    // Play bell immediately to mark new interval
    playBell();
  }

  // Highlight the chosen button
  document.querySelectorAll("#bellPopup button").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll("#bellPopup button").forEach(btn => {
    if (btn.dataset.min && parseInt(btn.dataset.min) === m) {
      btn.classList.add("active");
    }
  });

  closeAllPopups();
}

function saveCustomBell(){
  const v = document.getElementById("customMin").value;
  if (v > 0) {
    saveInterval(parseFloat(v));
    localStorage.setItem("bellCustom", v);
    document.getElementById("customMin").value = v;
  }
}





function saveSpeed(s) {
  breathCycle = parseInt(s);
  localStorage.setItem("breathCycle", breathCycle);
  localStorage.setItem("speedCustom", ""); // clear custom if preset chosen
  circle.style.animationDuration = breathCycle + "s";

  if (running) startBreathLoop();

  // Highlight chosen button
  document.querySelectorAll("#speedPopup button").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll("#speedPopup button").forEach(btn => {
    if (btn.dataset.speed && parseInt(btn.dataset.speed) === s) {
      btn.classList.add("active");
    }
  });

  closeAllPopups();
}

function saveCustomSpeed(){
  const v = document.getElementById("customSpeed").value;
  if (v > 1) {
    saveSpeed(parseFloat(v));
    localStorage.setItem("speedCustom", v);
    document.getElementById("customSpeed").value = v;
  }
}
timerEl.addEventListener("click", () => {
  closeAllPopups();
  bellPopup.style.display = "flex";
  overlay.style.display = "block";

  document.querySelectorAll("#bellPopup button").forEach(btn => btn.classList.remove("active"));

  const savedInterval = localStorage.getItem("bellInterval");
  const savedCustom = localStorage.getItem("bellCustom");

  if (savedCustom && savedCustom !== "") {
    document.getElementById("customMin").value = savedCustom;
  } else if (savedInterval) {
    const minutes = parseInt(savedInterval) / 60;
    document.querySelectorAll("#bellPopup button").forEach(btn => {
      if (btn.dataset.min && parseInt(btn.dataset.min) === minutes) {
        btn.classList.add("active");
      }
    });
  }
});


