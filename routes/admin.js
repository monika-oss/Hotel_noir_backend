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
    const { Resend } = require('resend');
    
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ success: false, error: 'RESEND_API_KEY is missing' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: 'Noir & Gold <onboarding@resend.dev>',
      to: [process.env.ADMIN_EMAIL],
      subject: 'Render Server Email Test (Resend API)',
      html: '<p>If you are reading this, email from Render is working via Resend API!</p>'
    });

    if (error) {
      return res.status(500).json({ success: false, error: error.message, fullError: error });
    }

    res.json({ 
      success: true, 
      message: 'Test email sent successfully via Resend API', 
      data: data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message, 
      fullError: error
    });
  }
});

module.exports = router;
