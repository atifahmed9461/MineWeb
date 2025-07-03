require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mineflayer = require('mineflayer');
const botController = require('./botController');
const cors = require('cors');

// Express server setup
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Bot state
let bot = null;
let isConnected = false;
let messages = [];
let onlinePlayers = []; // Track online players
let lastBotConfig = null; // Store the last bot config for reconnections
let reconnectTimer = null;
let reconnectDelay = 5000; // Start with 5 seconds, will increase on failures
let lastKickReason = null;
let reconnectAttempts = 0;
let manualDisconnect = false; // Add a flag to track manual disconnection
let botStats = {
  health: 0,
  food: 0,
  isAlive: false,
  isSleeping: false,
  isOperator: false,
  gameMode: undefined
}; // Track bot statistics
const MAX_MESSAGES = 100;
const MAX_RECONNECT_DELAY = 300000; // Max 5 minutes between reconnect attempts
const MIN_RECONNECT_DELAY = 60000; // Minimum 1 minute between reconnects on throttling
const PLAYER_UPDATE_INTERVAL = 30000; // Check players every 30 seconds
const STATS_UPDATE_INTERVAL = 2000; // Update stats every 2 seconds

// Load initial server config
const defaultServer = {
  ip: process.env.MC_SERVER_IP || 'localhost',
  port: process.env.MC_SERVER_PORT || '25565',
  username: process.env.BOT_USERNAME || 'WebBot'
};

// Track the player update interval
let playerUpdateInterval = null;
// Track the stats update interval
let statsUpdateInterval = null;

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send current bot status and messages to new clients
  socket.emit('botStatus', { 
    connected: isConnected,
    username: bot ? bot.username : defaultServer.username,
    server: bot && isConnected ? `${bot.host}:${bot.port}` : (lastBotConfig ? 
      `${lastBotConfig.host}:${lastBotConfig.port}` : 
      `${defaultServer.ip}:${defaultServer.port}`)
  });
  
  // Send chat history
  socket.emit('chatHistory', messages);
  
  // Send current player list
  socket.emit('playerList', onlinePlayers);
  
  // Send current bot stats
  socket.emit('botStats', botStats);
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
  
  // Handle message from web interface
  socket.on('sendMessage', (data) => {
    if (bot && isConnected) {
      bot.chat(data.message);
      console.log(`[WEB -> MC] ${data.message}`);
    } else {
      socket.emit('error', { message: 'Bot is not connected' });
    }
  });
  
  // Handle request for player list refresh
  socket.on('requestPlayerList', () => {
    if (bot && isConnected) {
      updatePlayerList();
      socket.emit('playerList', onlinePlayers);
    } else {
      socket.emit('playerList', []);
    }
  });
  
  // Handle request for stats refresh
  socket.on('requestStats', () => {
    if (bot && isConnected) {
      updateBotStats();
      socket.emit('botStats', botStats);
    } else {
      socket.emit('botStats', {
        health: 0,
        food: 0,
        isAlive: false,
        isSleeping: false
      });
    }
  });
  
  // Handle bot connect request
  socket.on('connectBot', (data) => {
    try {
      // Clear any pending reconnect attempts
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      
      // Reset the manual disconnect flag when connecting
      manualDisconnect = false;
      
      // Reset reconnect state when manually connecting
      reconnectDelay = 5000;
      reconnectAttempts = 0;
      lastKickReason = null;
      
      // Reset player list
      onlinePlayers = [];
      
      // If bot is already connected, disconnect first
      if (bot) {
        disconnectBot();
      }
      
      const serverIP = data.serverIP || defaultServer.ip;
      const serverPort = data.serverPort || defaultServer.port;
      const username = data.username || defaultServer.username;
      const auth = data.auth || process.env.BOT_AUTH || 'offline';
      
      // Store the config for potential reconnection
      lastBotConfig = {
        host: serverIP,
        port: parseInt(serverPort),
        username: username,
        password: process.env.BOT_PASSWORD || undefined,
        auth: auth
      };
      
      bot = botController.createBot(lastBotConfig);
      
      // Setup event handlers
      setupBotEvents(bot);
      
      socket.emit('botStatus', { 
        connected: true,
        connecting: true,
        username: username,
        server: `${serverIP}:${serverPort}`
      });
      
    } catch (error) {
      console.error('Error connecting bot:', error);
      socket.emit('error', { message: 'Failed to connect bot: ' + error.message });
    }
  });
  
  // Handle bot disconnect request
  socket.on('disconnectBot', () => {
    if (bot) {
      // User manually disconnected, clear any reconnect timers
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      
      // Set manual disconnect flag to prevent auto-reconnect
      manualDisconnect = true;
      
      // Clear player update interval
      if (playerUpdateInterval) {
        clearInterval(playerUpdateInterval);
        playerUpdateInterval = null;
      }
      
      // Reset reconnection state
      reconnectDelay = 5000;
      reconnectAttempts = 0;
      lastKickReason = null;
      
      // Clear player list
      onlinePlayers = [];
      io.emit('playerList', []);
      
      disconnectBot();
      socket.emit('botStatus', { 
        connected: false,
        username: lastBotConfig ? lastBotConfig.username : defaultServer.username,
        server: lastBotConfig ? `${lastBotConfig.host}:${lastBotConfig.port}` : `${defaultServer.ip}:${defaultServer.port}`
      });
    }
  });

  // Handle admin actions
  socket.on('adminAction', async (data) => {
    if (!bot || !isConnected) {
      socket.emit('error', { message: 'Bot is not connected' });
      return;
    }

    // Check if bot has a gamemode set
    if (!bot.game || typeof bot.game.gameMode === 'undefined') {
      socket.emit('error', { message: 'Bot does not have sufficient permissions' });
      return;
    }

    const { action, target, reason, gameMode } = data;
    
    try {
      switch (action) {
        case 'selfGamemode':
          // Change bot's own gamemode
          await bot.chat(`/gamemode ${gameMode}`);
          break;
        case 'kick':
          await bot.chat(reason ? `/kick ${target} ${reason}` : `/kick ${target}`);
          break;
        case 'ban':
          await bot.chat(reason ? `/ban ${target} ${reason}` : `/ban ${target}`);
          break;
        case 'kill':
          await bot.chat(`/kill ${target}`);
          break;
        case 'tp':
          // For teleport, we use the reason parameter as the destination player
          await bot.chat(`/tp ${target} ${reason}`);
          break;
        case 'gamemode':
          await bot.chat(`/gamemode ${gameMode} ${target}`);
          break;
        default:
          socket.emit('error', { message: 'Unknown admin action' });
          return;
      }
      
      // Add admin action to chat
      const adminMessage = {
        text: action === 'selfGamemode'
          ? `Changed own gamemode to ${gameMode}`
          : action === 'tp'
            ? `Teleported ${target} to ${reason}`
            : `Admin action: ${action} performed on ${target}${reason ? ` (Reason: ${reason})` : ''}${gameMode ? ` (Gamemode: ${gameMode})` : ''}`,
        timestamp: new Date().toISOString(),
        isSystem: true,
        type: 'admin'
      };
      
      messages.push(adminMessage);
      io.emit('chatMessage', adminMessage);
      
    } catch (err) {
      console.error(`Error performing admin action: ${err}`);
      socket.emit('error', { message: `Failed to perform ${action}: ${err.message}` });
    }
  });
});

// Function to update the player list
function updatePlayerList() {
  if (!bot || !isConnected) {
    onlinePlayers = [];
    return;
  }
  
  try {
    // Get list of online players from the bot
    const playerEntities = Object.values(bot.players);
    
    // Format player data with additional info
    onlinePlayers = playerEntities.map(player => ({
      username: player.username,
      ping: player.ping || 0,
      uuid: player.uuid || '',
      isBot: player.username === bot.username // Flag if it's our bot
    })).sort((a, b) => a.username.localeCompare(b.username)); // Sort alphabetically
    
    console.log(`Updated player list: ${onlinePlayers.length} players online`);
    
    // Broadcast the updated player list to all connected clients
    io.emit('playerList', onlinePlayers);
  } catch (err) {
    console.error('Error updating player list:', err);
  }
}

// Extract seconds from kick message if it contains a wait time
function extractWaitTime(reason) {
  if (!reason) return null;
  
  let reasonText = '';
  
  if (typeof reason === 'object') {
    if (reason.text) {
      reasonText = reason.text;
    } else if (reason.translate) {
      reasonText = reason.translate;
    } else {
      try {
        reasonText = JSON.stringify(reason);
      } catch (e) {
        reasonText = String(reason);
      }
    }
  } else if (typeof reason === 'string') {
    // Try to parse it as JSON first
    try {
      const parsed = JSON.parse(reason);
      if (parsed.text) {
        reasonText = parsed.text;
      } else {
        reasonText = reason;
      }
    } catch (e) {
      reasonText = reason;
    }
  } else {
    reasonText = String(reason);
  }
  
  // Check for seconds pattern (e.g., "wait 45 seconds")
  const secondsMatch = reasonText.match(/wait (\d+) seconds/i);
  if (secondsMatch && secondsMatch[1]) {
    return parseInt(secondsMatch[1]) * 1000; // Convert to milliseconds
  }
  
  // Check for minutes pattern (e.g., "wait 2 minutes")
  const minutesMatch = reasonText.match(/wait (\d+) minutes?/i);
  if (minutesMatch && minutesMatch[1]) {
    return parseInt(minutesMatch[1]) * 60 * 1000; // Convert to milliseconds
  }
  
  // Check for throttled message
  if (reasonText.includes('throttled') || reasonText.includes('before reconnecting')) {
    return MIN_RECONNECT_DELAY; // Use minimum delay for throttled connections
  }
  
  return null;
}

// Schedule a reconnection with appropriate delay
function scheduleReconnect() {
  // Clear any existing reconnect timer
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  
  // Increase reconnection attempts
  reconnectAttempts++;
  
  // Get delay based on kick reason or use exponential backoff
  let delay = reconnectDelay;
  
  // If we were kicked with a specific wait time, use that
  if (lastKickReason) {
    const waitTime = extractWaitTime(lastKickReason);
    if (waitTime) {
      // Add a small margin to the wait time to avoid immediate rejection
      delay = waitTime + 5000; // Add 5 seconds margin
      
      // Ensure minimum delay on throttling issues
      if (waitTime === MIN_RECONNECT_DELAY) {
        delay = MIN_RECONNECT_DELAY * (1 + (reconnectAttempts * 0.5)); // Increase by 50% each time
      }
    } else if (reconnectAttempts > 3) {
      // If we've had multiple failed attempts without specific wait time
      delay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
    }
  }
  
  console.log(`Scheduling reconnect in ${Math.round(delay/1000)} seconds (Attempt #${reconnectAttempts})...`);
  
  // Update the UI to show reconnection status
  io.emit('botStatus', { 
    connected: false, 
    connecting: false,
    username: lastBotConfig ? lastBotConfig.username : defaultServer.username,
    server: lastBotConfig ? `${lastBotConfig.host}:${lastBotConfig.port}` : `${defaultServer.ip}:${defaultServer.port}`
  });
  
  // Add a message about reconnection to the chat
  const reconnectMessage = {
    text: `Bot disconnected. Will attempt to reconnect in ${Math.round(delay/1000)} seconds (Attempt #${reconnectAttempts})`,
    timestamp: new Date().toISOString()
  };
  
  messages.push(reconnectMessage);
  io.emit('chatMessage', reconnectMessage);
  
  // Schedule the reconnect
  reconnectTimer = setTimeout(() => {
    if (!isConnected && lastBotConfig) {
      console.log(`Attempting to reconnect... (Attempt #${reconnectAttempts})`);
      io.emit('botStatus', { 
        connected: false, 
        connecting: true,
        username: lastBotConfig.username,
        server: `${lastBotConfig.host}:${lastBotConfig.port}`
      });
      
      try {
        // Create a new bot instance
        bot = botController.createBot(lastBotConfig);
        setupBotEvents(bot);
        
        // Increase the delay for next time (exponential backoff)
        reconnectDelay = Math.min(reconnectDelay * 1.5, MAX_RECONNECT_DELAY);
      } catch (error) {
        console.error('Error reconnecting:', error);
        io.emit('error', { message: 'Failed to reconnect: ' + error.message });
        
        // If reconnection failed, schedule another attempt
        scheduleReconnect();
      }
    }
  }, delay);
}

// Function to update bot stats
function updateBotStats() {
  if (!bot || !isConnected) {
    botStats = {
      health: 0,
      food: 0,
      isAlive: false,
      isSleeping: false,
      isOperator: false,
      gameMode: undefined
    };
    return;
  }
  
  try {
    // Get basic stats that are always available
    botStats = {
      health: bot.health || 0,
      food: bot.food || 0,
      isAlive: bot.entity && bot.entity.isValid || false,
      isSleeping: bot.isSleeping || false,
      isOperator: false, // TODO: Implement a real OP check if possible
      gameMode: bot.game && bot.game.gameMode
    };
    
    // Add position if available
    if (bot.entity && bot.entity.position) {
      botStats.position = {
        x: bot.entity.position.x,
        y: bot.entity.position.y,
        z: bot.entity.position.z
      };
    }
    
    // Add experience if available
    if (typeof bot.experience !== 'undefined') {
      botStats.experience = {
        level: bot.experience.level,
        points: bot.experience.points,
        progress: bot.experience.progress
      };
    }
    
    // Add armor points if available
    if (typeof bot.armorPoints !== 'undefined') {
      botStats.armor = bot.armorPoints;
    }
    
    // Broadcast the updated stats to all connected clients
    io.emit('botStats', botStats);
  } catch (err) {
    console.error('Error updating bot stats:', err);
  }
}

// Setup bot event handlers
function setupBotEvents(bot) {
  bot.on('login', () => {
    console.log(`Bot logged in as ${bot.username}`);
    isConnected = true;
    
    // Reset reconnection state on successful login
    reconnectDelay = 5000;
    reconnectAttempts = 0;
    lastKickReason = null;
    
    // Initialize player list
    setTimeout(() => {
      updatePlayerList();
    }, 2000); // Wait 2 seconds after login to get the player list
    
    // Start player list update interval
    if (playerUpdateInterval) {
      clearInterval(playerUpdateInterval);
    }
    
    playerUpdateInterval = setInterval(() => {
      updatePlayerList();
    }, PLAYER_UPDATE_INTERVAL);
    
    // Initialize bot stats
    setTimeout(() => {
      updateBotStats();
    }, 2000); // Wait 2 seconds after login to get stats
    
    // Start stats update interval
    if (statsUpdateInterval) {
      clearInterval(statsUpdateInterval);
    }
    
    statsUpdateInterval = setInterval(() => {
      updateBotStats();
    }, STATS_UPDATE_INTERVAL);
    
    // Add a login message to the chat
    const loginMessage = {
      text: `Bot successfully connected to server as ${bot.username}`,
      timestamp: new Date().toISOString()
    };
    
    messages.push(loginMessage);
    
    io.emit('botStatus', { 
      connected: true,
      connecting: false,
      username: bot.username,
      server: `${bot.host}:${bot.port}`
    });
    
    io.emit('chatMessage', loginMessage);
  });
  
  bot.on('end', () => {
    console.log('Bot disconnected');
    isConnected = false;
    
    // Clear player update interval
    if (playerUpdateInterval) {
      clearInterval(playerUpdateInterval);
      playerUpdateInterval = null;
    }
    
    // Clear stats update interval
    if (statsUpdateInterval) {
      clearInterval(statsUpdateInterval);
      statsUpdateInterval = null;
    }
    
    // Clear player list
    onlinePlayers = [];
    io.emit('playerList', []);
    
    // Reset stats
    botStats = {
      health: 0,
      food: 0,
      isAlive: false,
      isSleeping: false,
      isOperator: false,
      gameMode: undefined
    };
    io.emit('botStats', botStats);
    
    // Get the last known server info for display purposes
    const lastServerInfo = lastBotConfig ? 
      `${lastBotConfig.host}:${lastBotConfig.port}` : 
      `${defaultServer.ip}:${defaultServer.port}`;
    
    io.emit('botStatus', { 
      connected: false,
      connecting: false,
      username: lastBotConfig ? lastBotConfig.username : defaultServer.username,
      server: lastServerInfo
    });
    
    // Attempt to reconnect if we have a previous config and it wasn't a manual disconnect
    if (lastBotConfig && !manualDisconnect) {
      scheduleReconnect();
    }
  });
  
  bot.on('kicked', (reason) => {
    // Store kick reason for reconnection logic
    lastKickReason = reason;
    
    // Log the reason only once
    if (typeof reason === 'object') {
      console.log(`Bot was kicked: ${JSON.stringify(reason)}`);
    } else {
      console.log(`Bot was kicked: ${reason}`);
    }
    
    // Add kick message to chat
    const kickMessage = {
      text: `Bot was kicked from server: ${typeof reason === 'object' ? (reason.text || JSON.stringify(reason)) : reason}`,
      timestamp: new Date().toISOString()
    };
    
    messages.push(kickMessage);
    io.emit('chatMessage', kickMessage);
  });
  
  bot.on('error', (err) => {
    console.error('Bot error:', err);
    io.emit('error', { message: err.message });
    
    // Add error message to chat
    const errorMessage = {
      text: `Bot error: ${err.message}`,
      timestamp: new Date().toISOString()
    };
    
    messages.push(errorMessage);
    io.emit('chatMessage', errorMessage);
  });
  
  bot.on('message', (message) => {
    const formattedMessage = message.toString();
    console.log(`[MC] ${formattedMessage}`);
    
    // Add message to history and trim if needed
    messages.push({
      text: formattedMessage,
      timestamp: new Date().toISOString()
    });
    
    if (messages.length > MAX_MESSAGES) {
      messages.shift();
    }
    
    io.emit('chatMessage', {
      text: formattedMessage,
      timestamp: new Date().toISOString()
    });
  });
  
  // Player join event
  bot.on('playerJoined', (player) => {
    console.log(`Player joined: ${player.username}`);
    
    // Update player list
    updatePlayerList();
    
    // Add player join message to chat
    const joinMessage = {
      text: `Player joined: ${player.username}`,
      timestamp: new Date().toISOString(),
      isSystem: true,
      type: 'join'
    };
    
    messages.push(joinMessage);
    io.emit('chatMessage', joinMessage);
  });
  
  // Player leave event
  bot.on('playerLeft', (player) => {
    console.log(`Player left: ${player.username}`);
    
    // Update player list
    updatePlayerList();
    
    // Add player leave message to chat
    const leaveMessage = {
      text: `Player left: ${player.username}`,
      timestamp: new Date().toISOString(),
      isSystem: true,
      type: 'leave'
    };
    
    messages.push(leaveMessage);
    io.emit('chatMessage', leaveMessage);
  });
  
  // Handle health updates
  bot.on('health', () => {
    console.log(`Bot health: ${bot.health}, food: ${bot.food}`);
    updateBotStats();
  });
  
  // Handle game updates
  bot.on('game', () => {
    updateBotStats();
  });
  
  // Handle experience updates
  bot.on('experience', () => {
    updateBotStats();
  });
  
  // Handle spawn (when the bot spawns in the world)
  bot.on('spawn', () => {
    console.log(`Bot spawned in the world`);
    updateBotStats();
  });
  
  // Handle death
  bot.on('death', () => {
    console.log(`Bot died and will respawn`);
    
    // Add death message to chat
    const deathMessage = {
      text: `Bot died and will respawn`,
      timestamp: new Date().toISOString(),
      isSystem: true,
      type: 'death'
    };
    
    messages.push(deathMessage);
    io.emit('chatMessage', deathMessage);
    
    updateBotStats();
  });
  
  // Handle sleep start
  bot.on('sleep', () => {
    updateBotStats();
  });
  
  // Handle wake up
  bot.on('wake', () => {
    updateBotStats();
  });
}

// Disconnect bot
function disconnectBot() {
  if (bot) {
    // Clear player update interval
    if (playerUpdateInterval) {
      clearInterval(playerUpdateInterval);
      playerUpdateInterval = null;
    }
    
    // Clear stats update interval
    if (statsUpdateInterval) {
      clearInterval(statsUpdateInterval);
      statsUpdateInterval = null;
    }
    
    bot.end();
    bot = null;
    isConnected = false;
    
    // Clear player list
    onlinePlayers = [];
    
    // Reset stats
    botStats = {
      health: 0,
      food: 0,
      isAlive: false,
      isSleeping: false,
      isOperator: false,
      gameMode: undefined
    };
  }
}

// API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    connected: isConnected,
    username: bot ? bot.username : (lastBotConfig ? lastBotConfig.username : defaultServer.username),
    server: bot ? `${bot.host}:${bot.port}` : (lastBotConfig ? 
      `${lastBotConfig.host}:${lastBotConfig.port}` : 
      `${defaultServer.ip}:${defaultServer.port}`)
  });
});

app.get('/api/players', (req, res) => {
  res.json(onlinePlayers);
});

app.post('/api/connect', (req, res) => {
  try {
    // Clear any pending reconnect attempts
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    // Reset reconnect state when manually connecting
    reconnectDelay = 5000;
    reconnectAttempts = 0;
    lastKickReason = null;
    
    const { serverIP, serverPort, username, auth } = req.body;
    
    // If bot is already connected, disconnect first
    if (bot) {
      disconnectBot();
    }
    
    const config = {
      host: serverIP || defaultServer.ip,
      port: parseInt(serverPort || defaultServer.port),
      username: username || defaultServer.username,
      password: process.env.BOT_PASSWORD || undefined,
      auth: auth || process.env.BOT_AUTH || 'offline'
    };
    
    // Store the config for potential reconnection
    lastBotConfig = config;
    
    bot = botController.createBot(config);
    
    // Setup event handlers
    setupBotEvents(bot);
    
    res.json({ success: true, message: 'Connecting bot...' });
  } catch (error) {
    console.error('Error connecting bot:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/disconnect', (req, res) => {
  // Clear any pending reconnect
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  // Set manual disconnect flag to prevent auto-reconnect
  manualDisconnect = true;
  
  // Reset reconnection state
  reconnectDelay = 5000;
  reconnectAttempts = 0;
  lastKickReason = null;
  
  disconnectBot();
  res.json({ success: true });
});

app.post('/api/send-message', (req, res) => {
  const { message } = req.body;
  
  if (!bot || !isConnected) {
    return res.status(400).json({ success: false, message: 'Bot is not connected' });
  }
  
  bot.chat(message);
  res.json({ success: true });
});

app.get('/api/messages', (req, res) => {
  res.json(messages);
});

// Start server
const PORT = process.env.BOT_SERVER_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Bot server running on port ${PORT}`);
}); 