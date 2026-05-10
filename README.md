# CDL Timer

A global synchronized timer web application built with Node.js, Express, and Socket.IO. All users see the same timer state in real-time, making it perfect for coordinated activities.

## Features

- **Real-time Synchronization**: All connected users see the same timer state
- **Multi-Timer Support**: Toggle between displaying 1, 2, 3, or 4 timers
- **Pin-Protected Controls**: Drawer controls are protected with a PIN (default: 1234)
- **Time Adjustments**: Quickly adjust timer values (+/- 1s, 5s, 1min, 5min)
- **Custom Timer Names**: Name each timer for easy identification
- **Light/Dark Mode**: Toggle between themes with persistent preference
- **Responsive Design**: Works on desktop and mobile devices

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Application

Start the server:
```bash
npm start
```

The application will run on `http://localhost:3044`

## Usage

### Accessing the Timer
- Open your browser and navigate to `http://localhost:3044`
- The timer(s) will be displayed on the main screen
- All users see the same timer state in real-time

### Using the Controls

1. **Open the Control Drawer**: Click on the handle bar at the bottom of the screen
2. **Enter PIN**: Enter the PIN (default: `1234`) to unlock controls
3. **Control Options**:
   - **Display Settings**: Toggle between 1, 2, 3, or 4 timer display
   - **Time Adjustments**: Use the +/- buttons to adjust timer values
   - **Start/Stop**: Control timer running state
   - **Timer Names**: Type custom names for each timer

### Changing the PIN

Edit `server.js` and modify the PIN constant:
```javascript
const PIN = '1234'; // Change this to your desired PIN
```

## Configuration

### Port
The server runs on port 3044 by default. To change this, edit the `PORT` constant in `server.js`:
```javascript
const PORT = 3044; // Change to desired port
```

## Technical Details

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Real-time Communication**: Socket.IO for bidirectional event-based communication
- **State Management**: Server-side timer state with client synchronization
- **Theme Persistence**: LocalStorage for theme preference
- **Auth Persistence**: SessionStorage for PIN authentication

## File Structure

```
CDLTimer/
├── server.js           # Express + Socket.IO server
├── package.json        # Project dependencies
├── README.md          # This file
└── public/
    ├── index.html     # Main HTML page
    ├── style.css      # Styles with theme support
    └── app.js         # Client-side JavaScript
```

## Browser Compatibility

Works with all modern browsers that support:
- ES6 JavaScript
- CSS Custom Properties (CSS Variables)
- WebSocket (for Socket.IO)
