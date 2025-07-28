const express = require("express");
const axios = require("axios");
const router = express.Router();

const ABSTRACT_API_KEY = process.env.ABSTRACT_API_KEY;

router.post("/validate", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required." });

  // Debug logging
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    ABSTRACT_API_KEY: ABSTRACT_API_KEY ? 'SET' : 'NOT SET',
    email: email
  });

  if (!ABSTRACT_API_KEY || ABSTRACT_API_KEY === 'test_key') {
    console.error('API Key Error:', { ABSTRACT_API_KEY: ABSTRACT_API_KEY });
    return res.status(400).json({ 
      message: "Abstract API key is required. Please set ABSTRACT_API_KEY in your environment variables.",
      debug: {
        hasKey: !!ABSTRACT_API_KEY,
        keyLength: ABSTRACT_API_KEY ? ABSTRACT_API_KEY.length : 0
      }
    });
  }

  try {
    console.log(`Validating email: ${email}`);
    const response = await axios.get(
      `https://emailvalidation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&email=${email}`
    );
    
    console.log('Abstract API Response:', JSON.stringify(response.data, null, 2));
    
    // Use the correct fields from Abstract API response
    const isVerified = response.data.deliverability === "DELIVERABLE" || 
                      (response.data.is_smtp_valid && response.data.is_smtp_valid.value === true);
    
    // Return simplified result
    const result = {
      email: email,
      is_verified: isVerified
    };
    
    res.json(result);
  } catch (error) {
    console.error("Abstract API Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    res.status(500).json({ 
      message: "Error validating email", 
      error: error.response?.data?.message || error.message,
      debug: {
        status: error.response?.status,
        data: error.response?.data
      }
    });
  }
});

router.post("/bulk-validate", async (req, res) => {
  const { emails } = req.body;

  if (!Array.isArray(emails)) {
    return res.status(400).json({ message: "emails must be an array." });
  }

  // Debug logging
  console.log('Bulk validation environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    ABSTRACT_API_KEY: ABSTRACT_API_KEY ? 'SET' : 'NOT SET',
    emailCount: emails.length
  });

  if (!ABSTRACT_API_KEY || ABSTRACT_API_KEY === 'test_key') {
    console.error('Bulk API Key Error:', { ABSTRACT_API_KEY: ABSTRACT_API_KEY });
    return res.status(400).json({ 
      message: "Abstract API key is required. Please set ABSTRACT_API_KEY in your environment variables.",
      debug: {
        hasKey: !!ABSTRACT_API_KEY,
        keyLength: ABSTRACT_API_KEY ? ABSTRACT_API_KEY.length : 0
      }
    });
  }

  try {
    const results = await Promise.all(
      emails.map(async (email) => {
        try {
          console.log(`Validating email: ${email}`);
          const response = await axios.get(
            `https://emailvalidation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&email=${email}`
          );
          
          // Use the correct fields from Abstract API response
          const isVerified = response.data.deliverability === "DELIVERABLE" || 
                            (response.data.is_smtp_valid && response.data.is_smtp_valid.value === true);
          
          // Return simplified result
          return {
            email: email,
            is_verified: isVerified
          };
        } catch (error) {
          console.error(`Error validating ${email}:`, {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          return {
            email: email,
            is_verified: false,
            error: error.response?.data?.message || error.message
          };
        }
      })
    );
    res.json(results);
  } catch (error) {
    console.error("Bulk validation error:", error.message);
    res.status(500).json({ 
      message: "Error validating emails", 
      error: error.message 
    });
  }
});

module.exports = router;
