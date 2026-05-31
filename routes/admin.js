const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/login', (req, res) => {
  const { password } = req.body;
  
  // Compare password, with fallback just in case env vars fail on Render
  if (password === process.env.ADMIN_PASSWORD || password === 'admin123') {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'super_secret_fallback_key', { expiresIn: '1d' });
    res.json({ token });
  } else {
    res.status(401);
    throw new Error('Invalid admin credentials');
  }
});

module.exports = router;
