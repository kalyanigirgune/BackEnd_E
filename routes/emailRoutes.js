const express = require("express");
const axios = require("axios");
const router = express.Router();

const ABSTRACT_API_KEY = process.env.ABSTRACT_API_KEY || "71b8f2362c2d4095b11314e5d2c0af8e";

router.post("/validate", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required." });

  if (!ABSTRACT_API_KEY || ABSTRACT_API_KEY === 'test_key') {
    return res.status(400).json({ 
      message: "Abstract API key is required. Please set ABSTRACT_API_KEY in your .env file." 
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
    console.error("Abstract API Error:", error.response?.data || error.message);
    res.status(500).json({ 
      message: "Error validating email", 
      error: error.response?.data?.message || error.message 
    });
  }
});

router.post("/bulk-validate", async (req, res) => {
  const { emails } = req.body;

  if (!Array.isArray(emails)) {
    return res.status(400).json({ message: "emails must be an array." });
  }

  if (!ABSTRACT_API_KEY || ABSTRACT_API_KEY === 'test_key') {
    return res.status(400).json({ 
      message: "Abstract API key is required. Please set ABSTRACT_API_KEY in your .env file." 
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
          console.error(`Error validating ${email}:`, error.response?.data || error.message);
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
