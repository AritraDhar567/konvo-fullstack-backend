const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const os = require('os');
// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const { errorHandler } = require('./middleware/errorHandler');
const { verifyToken } = require('./middleware/auth');

// Initialize Express app
const app = express();

// Initialize Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Make Supabase available to all routes
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', verifyToken, projectRoutes);
app.use('/api/tasks', verifyToken, taskRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running', status: 'ok' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  const networkInterfaces = os.networkInterfaces();

  let localIP = 'localhost';

  for (const interfaceName in networkInterfaces) {
    for (const iface of networkInterfaces[interfaceName]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
  }

  console.log(`\n🚀 Server running successfully`);
  console.log(`📍 Local:   http://localhost:${PORT}`);
  console.log(`🌐 Network: http://${localIP}:${PORT}`);
  console.log(`🩺 Health:  http://${localIP}:${PORT}/api/health`);
  console.log(`🔐 Auth:    http://${localIP}:${PORT}/api/auth`);
  console.log(`📁 Projects:http://${localIP}:${PORT}/api/projects`);
  console.log(`✅ Environment: ${process.env.NODE_ENV}\n`);
});

// Keep-Alive Ping Mechanism for Render Free Tier
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_EXTERNAL_URL) {
  const axios = require('axios');
  const pingInterval = 10 * 60 * 1000; // 10 minutes

  setInterval(async () => {
    try {
      console.log(`[Keep-Alive] Pinging self at ${RENDER_EXTERNAL_URL}/api/health...`);
      const response = await axios.get(`${RENDER_EXTERNAL_URL}/api/health`);
      console.log(`[Keep-Alive] Status: ${response.status} - ${response.data.status}`);
    } catch (error) {
      console.error(`[Keep-Alive] Error pinging self: ${error.message}`);
    }
  }, pingInterval);
}

module.exports = app;
