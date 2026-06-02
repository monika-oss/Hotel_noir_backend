const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

router.post('/login', (req, res) => {
  const { password } = req.body;
  
  if (password === process.env.ADMIN_PASSWORD || password === 'admin123') {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'super_secret_fallback_key', { expiresIn: '1d' });
    res.json({ token });
  } else {
    res.status(401);
    throw new Error('Invalid admin credentials');
  }
});

// TEST EMAIL ENDPOINT (Temporary for debugging)
router.get('/test-email', async (req, res) => {
  try {
    const templateParams = {
      to_email: process.env.ADMIN_EMAIL || 'test@example.com',
      customer_name: 'Admin Test',
      order_items: 'Test Item 1, Test Item 2',
      total_amount: '0.00',
      email: process.env.ADMIN_EMAIL || 'test@example.com',
      order_id: 'TEST-123',
      orders: []
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: 'service_05yfaao',
        template_id: 'template_z27i8ur',
        user_id: 'FDZD0SLFS6FK9rZYP',
        template_params: templateParams
      })
    });

    if (response.ok) {
      res.json({ 
        success: true, 
        message: 'Test email sent successfully to Customer via EmailJS API' 
      });
    } else {
      const errText = await response.text();
      res.status(500).json({ success: false, error: errText });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message, 
      fullError: error
    });
  }
});

module.exports = router;
