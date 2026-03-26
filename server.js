const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3044;
const REFRESH_VERSION_FILE = path.join(__dirname, '.refresh-version');

// Global timer state
let timerState = {
  timerCount: 1,
  timers: [
    {
      id: 1,
      name: 'Timer 1',
      timeInSeconds: 0,
      isRunning: false
    },
    {
      id: 2,
      name: 'Timer 2',
      timeInSeconds: 0,
      isRunning: false
    }
  ]
};

// Timer intervals
let timerIntervals = {};

// Refresh version management
function getRefreshVersion() {
  try {
    if (fs.existsSync(REFRESH_VERSION_FILE)) {
      return fs.readFileSync(REFRESH_VERSION_FILE, 'utf8').trim();
    }
  } catch (err) {
    console.error('Error reading refresh version:', err);
  }
  // Return initial version if file doesn't exist
  const initialVersion = Date.now().toString();
  saveRefreshVersion(initialVersion);
  return initialVersion;
}

function saveRefreshVersion(version) {
  try {
    fs.writeFileSync(REFRESH_VERSION_FILE, version, 'utf8');
  } catch (err) {
    console.error('Error saving refresh version:', err);
  }
}

function triggerRefresh() {
  const newVersion = Date.now().toString();
  saveRefreshVersion(newVersion);
  io.emit('force-refresh', newVersion);
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Start a timer
function startTimer(timerId) {
  if (timerIntervals[timerId]) {
    return; // Already running
  }

  const timer = timerState.timers.find(t => t.id === timerId);
  if (!timer) return;

  timer.isRunning = true;

  timerIntervals[timerId] = setInterval(() => {
    if (timer.timeInSeconds > 0) {
      timer.timeInSeconds--;
      io.emit('timer-update', timerState);
    } else {
      // Timer reached 0, stop it
      stopTimer(timerId);
      io.emit('timer-update', timerState);
    }
  }, 1000);
}

// Stop a timer
function stopTimer(timerId) {
  const timer = timerState.timers.find(t => t.id === timerId);
  if (!timer) return;

  timer.isRunning = false;

  if (timerIntervals[timerId]) {
    clearInterval(timerIntervals[timerId]);
    delete timerIntervals[timerId];
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');

  // Send current state to newly connected client
  socket.emit('timer-update', timerState);

  // Send current refresh version to check if client needs to refresh
  socket.emit('refresh-version', getRefreshVersion());

  // Refresh all clients
  socket.on('refresh-all-clients', () => {
    console.log('Refreshing all clients');
    triggerRefresh();
  });

  // Update timer count
  socket.on('set-timer-count', (count) => {
    if (count === 1 || count === 2) {
      timerState.timerCount = count;
      io.emit('timer-update', timerState);
    }
  });

  // Reset a single timer to a specific time
  socket.on('reset-timer', ({ timerId, seconds }) => {
    const timer = timerState.timers.find(t => t.id === timerId);
    if (!timer || typeof seconds !== 'number' || seconds < 0) return;

    stopTimer(timer.id);
    timer.timeInSeconds = seconds;
    io.emit('timer-update', timerState);
  });

  // Start timer
  socket.on('start-timer', (timerId) => {
    startTimer(timerId);
    io.emit('timer-update', timerState);
  });

  // Stop timer
  socket.on('stop-timer', (timerId) => {
    stopTimer(timerId);
    io.emit('timer-update', timerState);
  });

  // Start all timers
  socket.on('start-all', () => {
    timerState.timers.forEach(timer => {
      startTimer(timer.id);
    });
    io.emit('timer-update', timerState);
  });

  // Stop all timers
  socket.on('stop-all', () => {
    timerState.timers.forEach(timer => {
      stopTimer(timer.id);
    });
    io.emit('timer-update', timerState);
  });

  // Rename timer
  socket.on('rename-timer', ({ timerId, name }) => {
    const timer = timerState.timers.find(t => t.id === timerId);
    if (timer) {
      timer.name = name || `Timer ${timerId}`;
      io.emit('timer-update', timerState);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`CDL Timer running on http://localhost:${PORT}`);
});
