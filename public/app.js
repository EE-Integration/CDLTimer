// Socket.IO connection
const socket = io();

// State
let currentTimerState = null;

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const drawer = document.getElementById('drawer');
const drawerHandle = document.getElementById('drawer-handle');
const controls = document.getElementById('controls');
const timer1Element = document.getElementById('timer-1');
const timer2Element = document.getElementById('timer-2');
const timer1Display = document.getElementById('timer-1-display');
const timer2Display = document.getElementById('timer-2-display');
const timer1Name = document.getElementById('timer-1-name');
const timer2Name = document.getElementById('timer-2-name');
const timer1NameInput = document.getElementById('timer-1-name-input');
const timer2NameInput = document.getElementById('timer-2-name-input');
const timer2Controls = document.getElementById('timer-2-controls');
const showOneTimer = document.getElementById('show-one-timer');
const showTwoTimers = document.getElementById('show-two-timers');
const startTimer1 = document.getElementById('start-timer-1');
const stopTimer1 = document.getElementById('stop-timer-1');
const startTimer2 = document.getElementById('start-timer-2');
const stopTimer2 = document.getElementById('stop-timer-2');
const startAll = document.getElementById('start-all');
const stopAll = document.getElementById('stop-all');
const drawerTimer1Element = document.getElementById('drawer-timer-1');
const drawerTimer2Element = document.getElementById('drawer-timer-2');
const drawerTimer1Display = document.getElementById('drawer-timer-1-display');
const drawerTimer2Display = document.getElementById('drawer-timer-2-display');
const drawerTimer1Name = document.getElementById('drawer-timer-1-name');
const drawerTimer2Name = document.getElementById('drawer-timer-2-name');

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
  const icon = themeToggle.querySelector('.theme-icon');
  icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
});

// Drawer Management
let isDrawerOpen = false;

drawerHandle.addEventListener('click', () => {
  isDrawerOpen = !isDrawerOpen;
  drawer.classList.toggle('open', isDrawerOpen);
});

// Timer Display Management
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateTimerDisplay(state) {
  currentTimerState = state;

  // Update timer displays
  if (state.timers[0]) {
    timer1Display.textContent = formatTime(state.timers[0].timeInSeconds);
    timer1Name.textContent = state.timers[0].name;
    timer1NameInput.value = state.timers[0].name;
    drawerTimer1Display.textContent = formatTime(state.timers[0].timeInSeconds);
    drawerTimer1Name.textContent = state.timers[0].name;
  }

  if (state.timers[1]) {
    timer2Display.textContent = formatTime(state.timers[1].timeInSeconds);
    timer2Name.textContent = state.timers[1].name;
    timer2NameInput.value = state.timers[1].name;
    drawerTimer2Display.textContent = formatTime(state.timers[1].timeInSeconds);
    drawerTimer2Name.textContent = state.timers[1].name;
  }

  // Update timer visibility
  if (state.timerCount === 1) {
    timer1Element.style.display = 'block';
    timer2Element.style.display = 'none';
    timer2Controls.style.display = 'none';
    drawerTimer1Element.style.display = 'block';
    drawerTimer2Element.style.display = 'none';
    showOneTimer.classList.add('active');
    showTwoTimers.classList.remove('active');
  } else {
    timer1Element.style.display = 'block';
    timer2Element.style.display = 'block';
    timer2Controls.style.display = 'block';
    drawerTimer1Element.style.display = 'block';
    drawerTimer2Element.style.display = 'block';
    showOneTimer.classList.remove('active');
    showTwoTimers.classList.add('active');
  }

  // Update start/stop button states
  updateButtonStates(state);
}

function updateButtonStates(state) {
  // Timer 1
  if (state.timers[0]?.isRunning) {
    startTimer1.disabled = true;
    stopTimer1.disabled = false;
    startTimer1.style.opacity = '0.5';
    stopTimer1.style.opacity = '1';
  } else {
    startTimer1.disabled = false;
    stopTimer1.disabled = true;
    startTimer1.style.opacity = '1';
    stopTimer1.style.opacity = '0.5';
  }

  // Timer 2
  if (state.timers[1]?.isRunning) {
    startTimer2.disabled = true;
    stopTimer2.disabled = false;
    startTimer2.style.opacity = '0.5';
    stopTimer2.style.opacity = '1';
  } else {
    startTimer2.disabled = false;
    stopTimer2.disabled = true;
    startTimer2.style.opacity = '1';
    stopTimer2.style.opacity = '0.5';
  }
}

// Socket.IO Event Handlers
socket.on('timer-update', (state) => {
  updateTimerDisplay(state);
});

// Handle refresh version check
socket.on('refresh-version', (serverVersion) => {
  const clientVersion = localStorage.getItem('refresh-version');
  if (clientVersion && clientVersion !== serverVersion) {
    // Server version changed, refresh the page
    localStorage.setItem('refresh-version', serverVersion);
    location.reload();
  } else {
    // Store the current version
    localStorage.setItem('refresh-version', serverVersion);
  }
});

// Handle forced refresh command
socket.on('force-refresh', (newVersion) => {
  // Update version before reloading to prevent refresh loop
  localStorage.setItem('refresh-version', newVersion);
  location.reload();
});

// Timer Count Controls
showOneTimer.addEventListener('click', () => {
  socket.emit('set-timer-count', 1);
});

showTwoTimers.addEventListener('click', () => {
  socket.emit('set-timer-count', 2);
});

// Reset Controls
const reset3min = document.getElementById('reset-3min');
const reset5min = document.getElementById('reset-5min');

reset3min.addEventListener('click', () => {
  socket.emit('reset-all-timers', 180); // 3 minutes in seconds
});

reset5min.addEventListener('click', () => {
  socket.emit('reset-all-timers', 300); // 5 minutes in seconds
});

// Start/Stop Controls
startTimer1.addEventListener('click', () => {
  socket.emit('start-timer', 1);
});

stopTimer1.addEventListener('click', () => {
  socket.emit('stop-timer', 1);
});

startTimer2.addEventListener('click', () => {
  socket.emit('start-timer', 2);
});

stopTimer2.addEventListener('click', () => {
  socket.emit('stop-timer', 2);
});

// Start All / Stop All Controls
startAll.addEventListener('click', () => {
  socket.emit('start-all');
});

stopAll.addEventListener('click', () => {
  socket.emit('stop-all');
});

// Refresh All Clients
const refreshAll = document.getElementById('refresh-all');
refreshAll.addEventListener('click', () => {
  if (confirm('This will refresh all connected clients. Continue?')) {
    socket.emit('refresh-all-clients');
  }
});

// Name Change Controls
let timer1NameTimeout;
timer1NameInput.addEventListener('input', (e) => {
  clearTimeout(timer1NameTimeout);
  timer1NameTimeout = setTimeout(() => {
    socket.emit('rename-timer', { timerId: 1, name: e.target.value });
  }, 500);
});

let timer2NameTimeout;
timer2NameInput.addEventListener('input', (e) => {
  clearTimeout(timer2NameTimeout);
  timer2NameTimeout = setTimeout(() => {
    socket.emit('rename-timer', { timerId: 2, name: e.target.value });
  }, 500);
});

// Initialize
initTheme();
