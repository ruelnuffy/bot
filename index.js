const { Client, LocalAuth } = require('whatsapp-web.js');
// Commented out SupaAuth as we're switching to LocalAuth for reliability
// const SupaAuth = require('./supa-auth');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');   
const puppeteer = require('puppeteer-core');  // Ensure puppeteer-core is imported
const path = require('path');
const fs = require('fs').promises;

// ───────── Supabase (for your own tables, not auth) ─────────
if (!process.env.SUPA_URL || !process.env.SUPA_KEY) {
  throw new Error('Missing SUPA_URL or SUPA_KEY in environment');
}
const supabase = createClient(process.env.SUPA_URL, process.env.SUPA_KEY);

// Define Chrome executable path based on common locations
const CHROME_PATHS = [
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/snap/bin/chromium',
  // Add more potential paths if needed
];

// Function to find any installed browser
async function findChromePath() {
  const fs = require('fs');
  for (const path of CHROME_PATHS) {
    try {
      if (fs.existsSync(path)) {
        console.log(`Found browser at: ${path}`);
        return path;
      }
    } catch (e) {
      // Continue checking other paths
    }
  }
  
  // Add fallback to /usr/bin/chromium-browser which is common in containerized environments
  console.log('No standard Chrome installation found. Using fallback path.');
  return '/usr/bin/chromium-browser';
}

// Function to clean up session files
async function cleanupSession() {
  try {
    const sessionDir = path.join(__dirname, '.wwebjs_auth/session');
    console.log('Cleaning up session directory:', sessionDir);
    
    // Check if directory exists
    try {
      await fs.access(sessionDir);
    } catch (e) {
      console.log('No session directory found, skipping cleanup');
      return;
    }
    
    // Remove SingletonLock file if it exists
    try {
      await fs.unlink(path.join(sessionDir, 'SingletonLock'));
      console.log('Removed stale SingletonLock file');
    } catch (e) {
      // File might not exist, that's fine
      console.log('No SingletonLock file found');
    }
    
    // Optionally, delete other potentially problematic files
    const knownProblemFiles = ['SingletonCookie', 'SingletonSocket'];
    for (const file of knownProblemFiles) {
      try {
        await fs.unlink(path.join(sessionDir, file));
        console.log(`Removed stale ${file} file`);
      } catch (e) {
        // Files might not exist, that's fine
      }
    }
    
  } catch (error) {
    console.warn('Error during session cleanup:', error);
    // Continue anyway, we'll just log the error
  }
}

// Add more robust error handling for browser crashes
async function createNewBrowserInstance() {
  console.log('Creating new browser instance...');
  try {
    const chromePath = await findChromePath();
    return await puppeteer.launch({
      headless: true,
      executablePath: chromePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
  } catch (err) {
    console.error('Failed to create browser instance:', err);
    throw err;
  }
}

// ───────── Message handling functions ─────────
async function handleIncomingMessage(message) {
  try {
    const sender = await message.getContact();
    console.log(`New message from ${sender.pushname || sender.number}: ${message.body}`);
    
    // Store message in Supabase
    await storeMessageInSupabase(message, sender);
    
    // Process commands
    if (message.body.startsWith('!')) {
      await handleCommand(message);
    }
  } catch (err) {
    console.error('Error handling message:', err);
  }
}

async function storeMessageInSupabase(message, sender) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        { 
          message_id: message.id._serialized,
          from_number: message.from,
          sender_name: sender.pushname || '',
          message_body: message.body,
          timestamp: new Date(),
          is_processed: false
        }
      ]);
      
    if (error) {
      console.error('Error storing message in Supabase:', error);
    } else {
      console.log('Message stored in Supabase');
    }
  } catch (err) {
    console.error('Exception storing message:', err);
  }
}

async function handleCommand(message) {
  const command = message.body.split(' ')[0].substring(1).toLowerCase();
  const args = message.body.split(' ').slice(1);
  
  console.log(`Processing command: ${command}, args: ${args}`);
  
  switch (command) {
    case 'help':
      await message.reply('Available commands:\n!help - Show this message\n!ping - Check if bot is online\n!status - Get bot status');
      break;
    case 'ping':
      await message.reply('Pong! Bot is online and working.');
      break;
    case 'status':
      await sendBotStatus(message);
      break;
    default:
      await message.reply(`Unknown command: ${command}. Type !help for available commands.`);
  }
}

async function sendBotStatus(message) {
  try {
    const uptime = process.uptime();
    const uptimeStr = formatUptime(uptime);
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageStr = `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`;
    
    // Count messages in Supabase
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
      
    const messageCount = error ? 'Error getting count' : count;
    
    await message.reply(`*Bot Status*\n\nUptime: ${uptimeStr}\nMemory usage: ${memoryUsageStr}\nMessages processed: ${messageCount}`);
  } catch (err) {
    console.error('Error sending status:', err);
    await message.reply('Error getting bot status');
  }
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  seconds %= 3600 * 24;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// ───────── WhatsApp client ─────────
(async () => {
  try {
    // Clean up any stale session files first
    await cleanupSession();
    
    // Try to find Chrome path but don't fail if not found
    let chromePath;
    try {
      chromePath = await findChromePath();
    } catch (err) {
      console.log('Warning: Could not find Chrome installation. Using default.');
      chromePath = null; // Let puppeteer find Chrome on its own
    }
    
    // Use a completely fresh userDataDir
    const userDataDir = path.join(__dirname, '.wwebjs_auth', 'session-' + Date.now());
    console.log('Using fresh user data directory:', userDataDir);
    
    // Configure the WhatsApp client with the proper browser path
    const client = new Client({ 
      authStrategy: new LocalAuth({
        clientId: 'whatsapp-bot',
        dataPath: userDataDir
      }),
      puppeteer: { 
        headless: true,
        executablePath: chromePath,
        // Set a unique user data directory to avoid conflicts
        userDataDir: userDataDir,
        // Set a longer timeout for browser launch
        timeout: 120000,
        // More aggressive browser args for containerized environments
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-software-rasterizer',
          '--disable-features=site-per-process',
          '--headless=new',
          '--disable-infobars',
          '--disable-web-security',
          '--aggressive-cache-discard',
          '--disable-cache',
          '--disable-application-cache',
          '--disable-offline-load-stale-cache',
          '--disk-cache-size=0',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
        // Prevent timeout issues
        ignoreHTTPSErrors: true
      }
    });

    client.on('qr', qr => {
      console.log('QR Code received. Scan this QR code with your phone:');
      qrcode.generate(qr, { small: true });
      
      // Save QR code to a file for remote access if needed
      try {
        require('fs').writeFileSync('./last-qr.txt', qr);
        console.log('QR code saved to last-qr.txt');
      } catch (err) {
        console.error('Could not save QR code to file:', err);
      }
    });
    
    client.on('ready', () => {
      console.log('✅ WhatsApp bot is ready!');
      // Clear QR code file when authenticated
      try {
        require('fs').unlinkSync('./last-qr.txt');
      } catch (err) {
        // File might not exist, that's fine
      }
      
      // Set up message handling after client is ready
      setupMessageHandlers(client);
      
      // Set up cron jobs
      setupCronJobs(client);
    });
    
    client.on('auth_failure', e => {
      console.error('⚠️ Auth failure', e);
      // Delete the session directory and try again
      const fs = require('fs');
      try {
        if (fs.existsSync(userDataDir)) {
          console.log('Removing failed auth session directory');
          fs.rmSync(userDataDir, { recursive: true, force: true });
        }
      } catch (err) {
        console.error('Failed to remove auth directory:', err);
      }
      
      // Wait a bit and try again
      setTimeout(() => {
        console.log('Retrying after auth failure...');
        client.initialize();
      }, 5000);
    });
    
    // Add error event listener to detect and handle browser crashes
    client.on('error', error => {
      console.error('Client error:', error);
      // Try to gracefully handle errors and reconnect
      setTimeout(() => {
        console.log('Attempting to reinitialize after error...');
        try {
          client.initialize();
        } catch (e) {
          console.error('Reinitialization failed:', e);
        }
      }, 10000); // Wait 10 seconds before trying to reconnect
    });

    // Add more robust handling of disconnections
    client.on('disconnected', reason => {
      console.log('⚠️ Client disconnected:', reason);
      // Try to reconnect after a short delay
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        try {
          client.initialize();
        } catch (e) {
          console.error('Reconnection failed:', e);
        }
      }, 5000);
    });
    
    // Setup message handlers
    function setupMessageHandlers(client) {
      client.on('message', async msg => {
        await handleIncomingMessage(msg);
      });
      
      client.on('message_ack', (msg, ack) => {
        // Update message status in database
        updateMessageStatus(msg.id._serialized, ack);
      });
    }
    
    // Setup cron jobs
    function setupCronJobs(client) {
      // Run health check every 30 minutes
      cron.schedule('*/30 * * * *', async () => {
        console.log('Running health check...');
        await healthCheck(client);
      });
      
      // Process queued messages every 5 minutes
      cron.schedule('*/5 * * * *', async () => {
        console.log('Processing queued messages...');
        await processQueuedMessages(client);
      });
    }
    
    // Update message status in Supabase
    async function updateMessageStatus(messageId, ackStatus) {
      try {
        const { error } = await supabase
          .from('messages')
          .update({ 
            status: ackStatus,
            updated_at: new Date()
          })
          .eq('message_id', messageId);
          
        if (error) {
          console.error('Error updating message status:', error);
        }
      } catch (err) {
        console.error('Exception updating message status:', err);
      }
    }
    
    // Health check function
    async function healthCheck(client) {
      try {
        const state = client.getState();
        console.log('Client state:', state);
        
        // Log memory usage
        const memoryUsage = process.memoryUsage();
        console.log('Memory usage:', {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
        });
        
        // Log in Supabase
        await supabase.from('bot_logs').insert([{
          log_type: 'health_check',
          client_state: state,
          memory_usage: memoryUsage,
          timestamp: new Date()
        }]);
        
        // Reconnect if not connected
        if (state !== 'CONNECTED') {
          console.log('Client not connected. Attempting reconnection...');
          client.initialize();
        }
      } catch (err) {
        console.error('Health check failed:', err);
      }
    }
    
    // Process queued messages
    async function processQueuedMessages(client) {
      try {
        // Get queued messages from Supabase
        const { data, error } = await supabase
          .from('outgoing_messages')
          .select('*')
          .eq('is_sent', false)
          .limit(10);
          
        if (error) {
          console.error('Error fetching queued messages:', error);
          return;
        }
        
        console.log(`Found ${data.length} messages to send`);
        
        // Process each message
        for (const msg of data) {
          try {
            console.log(`Sending message to ${msg.to_number}: ${msg.message_body.substring(0, 20)}...`);
            
            // Send the message
            const chatId = msg.to_number.includes('@c.us') ? msg.to_number : `${msg.to_number}@c.us`;
            await client.sendMessage(chatId, msg.message_body);
            
            // Update the message as sent
            await supabase
              .from('outgoing_messages')
              .update({ 
                is_sent: true,
                sent_at: new Date()
              })
              .eq('id', msg.id);
              
            console.log(`Message ${msg.id} sent successfully`);
            
            // Don't flood WhatsApp API
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (err) {
            console.error(`Error sending message ${msg.id}:`, err);
            
            // Mark as failed
            await supabase
              .from('outgoing_messages')
              .update({ 
                error_message: err.message,
                attempts: msg.attempts + 1
              })
              .eq('id', msg.id);
          }
        }
      } catch (err) {
        console.error('Error processing queued messages:', err);
      }
    }

    console.log('Starting WhatsApp client initialization...');
    client.initialize();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Received SIGINT, shutting down gracefully...');
      try {
        // Log shutdown
        await supabase.from('bot_logs').insert([{
          log_type: 'shutdown',
          timestamp: new Date(),
          details: 'Graceful shutdown initiated by SIGINT'
        }]);
        
        // Give time for the log to be written
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Destroy the client
        await client.destroy();
        console.log('Client destroyed successfully');
      } catch (err) {
        console.error('Error during shutdown:', err);
      }
      process.exit(0);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Log to Supabase
      supabase.from('bot_logs').insert([{
        log_type: 'error',
        timestamp: new Date(),
        details: `Unhandled Rejection: ${reason}`
      }]).then(() => {
        console.log('Error logged to Supabase');
      }).catch(err => {
        console.error('Failed to log error to Supabase:', err);
      });
    });
    
  } catch (error) {
    console.error('Failed to initialize WhatsApp client:', error);
    
    // Log fatal error to Supabase
    try {
      await supabase.from('bot_logs').insert([{
        log_type: 'fatal_error',
        timestamp: new Date(),
        details: `Fatal initialization error: ${error.message}`,
        stack_trace: error.stack
      }]);
    } catch (err) {
      console.error('Failed to log fatal error to Supabase:', err);
    }
    
    // Exit with error code
    process.exit(1);
  }
})();