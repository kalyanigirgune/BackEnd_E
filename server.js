const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const emailRoutes = require("./routes/emailRoutes");

dotenv.config();
const app = express();

// CORS configuration for production
app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use("/api/emails", emailRoutes);

// Handle root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Email Validation API', 
    endpoints: {
      single: 'POST /api/emails/validate',
      bulk: 'POST /api/emails/bulk-validate'
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
