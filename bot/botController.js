const mineflayer = require('mineflayer');

/**
 * Creates a new Minecraft bot instance
 * @param {Object} options - Bot configuration options
 * @param {string} options.host - Server IP address
 * @param {number} options.port - Server port
 * @param {string} options.username - Bot username
 * @param {string} [options.password] - Bot password for online-mode servers
 * @param {string} [options.auth] - Authentication type ('microsoft', 'mojang', or 'offline')
 * @returns {Object} - The mineflayer bot instance
 */
function createBot(options) {
  if (!options.host || !options.port || !options.username) {
    throw new Error('Missing required bot configuration options');
  }

  // Default to offline authentication if no password provided
  const authType = options.auth || (options.password ? 'microsoft' : 'offline');

  const botOptions = {
    host: options.host,
    port: options.port,
    username: options.username,
    version: process.env.VERSION || options.version || false,
    logErrors: true,
    checkTimeoutInterval: 30000, // 30 seconds
    keepAlive: true,
    auth: authType
  };

  // Only add password if using an authenticated mode
  if (authType !== 'offline' && options.password) {
    botOptions.password = options.password;
  }

  console.log(`Connecting to ${options.host}:${options.port}`);
  const bot = mineflayer.createBot(botOptions);
  
  // Set up basic behaviors
  setupBasicBehaviors(bot);
  
  return bot;
}

/**
 * Sets up basic behaviors for the bot
 * @param {Object} bot - The mineflayer bot instance
 */
function setupBasicBehaviors(bot) {
  // Handle kicked events
  bot.on('kicked', (reason) => {
    console.log(`Bot was kicked: ${reason}`);
  });
  
  // Handle spawn events
  bot.on('spawn', () => {
    console.log(`Bot spawned in the world`);
  });
  
  // Handle death events
  bot.on('death', () => {
    console.log(`Bot died and will respawn`);
  });
  
  // Handle health updates
  bot.on('health', () => {
    console.log(`Bot health: ${bot.health}, food: ${bot.food}`);
  });
  
  // Handle player join events
  bot.on('playerJoined', (player) => {
    console.log(`Player joined: ${player.username}`);
  });
}

module.exports = {
  createBot
}; 