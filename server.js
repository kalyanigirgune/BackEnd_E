const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const emailRoutes = require("./routes/emailRoutes");

dotenv.config();
const app = express();

// CORS configuration for production
app.use(cors({
  origin: ['https://front-end-e.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    hasApiKey: !!process.env.ABSTRACT_API_KEY
  });
});

// Test API key endpoint
app.get('/test-api-key', (req, res) => {
  const apiKey = process.env.ABSTRACT_API_KEY;
  res.json({
    hasApiKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    keyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint for debugging
app.post('/test', (req, res) => {
  res.json({ 
    message: 'POST request received',
    body: req.body,
    headers: req.headers
  });
});

app.use("/api/emails", emailRoutes);

// Handle root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Email Validation API', 
    endpoints: {
      health: 'GET /health',
      testKey: 'GET /test-api-key',
      test: 'POST /test',
      single: 'POST /api/emails/validate',
      bulk: 'POST /api/emails/bulk-validate'
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Key: ${process.env.ABSTRACT_API_KEY ? 'SET' : 'NOT SET'}`);
});
