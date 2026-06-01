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
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Test connection first
    await transporter.verify();

    // Send test email
    const info = await transporter.sendMail({
      from: `"Noir & Gold" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: 'Render Server Email Test',
      text: 'If you are reading this, email from Render is working!'
    });

    res.json({ 
      success: true, 
      message: 'Test email sent successfully', 
      messageId: info.messageId,
      user: process.env.EMAIL_USER 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message, 
      fullError: error,
      user: process.env.EMAIL_USER ? 'Set correctly' : 'Missing',
      pass: process.env.EMAIL_PASS ? 'Set correctly' : 'Missing'
    });
  }
});

module.exports = router;
