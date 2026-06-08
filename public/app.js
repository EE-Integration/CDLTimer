// Socket.IO connection
const socket = io();

const MAX_TIMERS = 4;

// State
let currentTimerState = null;

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const drawer = document.getElementById('drawer');
const drawerHandle = document.getElementById('drawer-handle');
const timerContainer = document.getElementById('timer-container');
const timerCountButtons = document.querySelectorAll('.timer-count-button');
const startAll = document.getElementById('start-all');
const stopAll = document.getElementById('stop-all');
const refreshAll = document.getElementById('refresh-all');

const timerElements = Array.from({ length: MAX_TIMERS }, (_, index) => {
  const timerId = index + 1;

  return {
    id: timerId,
    timer: document.getElementById(`timer-${timerId}`),
    display: document.getElementById(`timer-${timerId}-display`),
    name: document.getElementById(`timer-${timerId}-name`),
    nameInput: document.getElementById(`timer-${timerId}-name-input`),
    controls: document.getElementById(`timer-${timerId}-controls`),
    start: document.getElementById(`start-timer-${timerId}`),
    stop: document.getElementById(`stop-timer-${timerId}`),
    reset3Min: document.getElementById(`reset-timer-${timerId}-3min`),
    reset5Min: document.getElementById(`reset-timer-${timerId}-5min`),
    drawerTimer: document.getElementById(`drawer-timer-${timerId}`),
    drawerDisplay: document.getElementById(`drawer-timer-${timerId}-display`),
    drawerName: document.getElementById(`drawer-timer-${timerId}-name`)
  };
});

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
  timerContainer.className = `timer-container timer-count-${state.timerCount}`;

  timerElements.forEach((elements, index) => {
    const timer = state.timers[index];
    const isVisible = index < state.timerCount;

    elements.timer.style.display = isVisible ? 'block' : 'none';
    elements.drawerTimer.style.display = isVisible ? 'block' : 'none';

    if (elements.controls) {
      elements.controls.style.display = isVisible ? 'block' : 'none';
    }

    if (!timer) {
      return;
    }

    const formattedTime = formatTime(timer.timeInSeconds);
    elements.display.textContent = formattedTime;
    elements.name.textContent = timer.name;
    elements.drawerDisplay.textContent = formattedTime;
    elements.drawerName.textContent = timer.name;

    if (document.activeElement !== elements.nameInput) {
      elements.nameInput.value = timer.name;
    }
  });

  timerCountButtons.forEach((button) => {
    const count = Number(button.dataset.timerCount);
    button.classList.toggle('active', count === state.timerCount);
  });

  updateButtonStates(state);
}

function updateButtonStates(state) {
  timerElements.forEach((elements, index) => {
    const isRunning = Boolean(state.timers[index]?.isRunning);

    elements.start.disabled = isRunning;
    elements.stop.disabled = !isRunning;
    elements.start.style.opacity = isRunning ? '0.5' : '1';
    elements.stop.style.opacity = isRunning ? '1' : '0.5';
  });
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
timerCountButtons.forEach((button) => {
  button.addEventListener('click', () => {
    socket.emit('set-timer-count', Number(button.dataset.timerCount));
  });
});

// Start All / Stop All Controls
startAll.addEventListener('click', () => {
  socket.emit('start-all');
});

stopAll.addEventListener('click', () => {
  socket.emit('stop-all');
});

// Refresh All Clients
refreshAll.addEventListener('click', () => {
  if (confirm('This will refresh all connected clients. Continue?')) {
    socket.emit('refresh-all-clients');
  }
});

// Per-timer controls
timerElements.forEach((elements) => {
  elements.reset3Min.addEventListener('click', () => {
    socket.emit('reset-timer', { timerId: elements.id, seconds: 180 });
  });

  elements.reset5Min.addEventListener('click', () => {
    socket.emit('reset-timer', { timerId: elements.id, seconds: 300 });
  });

  elements.start.addEventListener('click', () => {
    socket.emit('start-timer', elements.id);
  });

  elements.stop.addEventListener('click', () => {
    socket.emit('stop-timer', elements.id);
  });

  let nameChangeTimeout;
  elements.nameInput.addEventListener('input', (event) => {
    clearTimeout(nameChangeTimeout);
    nameChangeTimeout = setTimeout(() => {
      socket.emit('rename-timer', { timerId: elements.id, name: event.target.value });
    }, 500);
  });
});

// Initialize
initTheme();
