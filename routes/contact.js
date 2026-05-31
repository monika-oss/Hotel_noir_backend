const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Contact = require('../models/Contact');

const validateContact = [
  check('name', 'Name is required').not().isEmpty().trim().escape(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('message', 'Message is required').not().isEmpty().trim().escape()
];

// @route   POST /api/contact
// @desc    Submit a contact message
// @access  Public
router.post('/', validateContact, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return next(new Error(errors.array().map(e => e.msg).join(', ')));
  }

  try {
    const contact = await Contact.create(req.body);
    res.status(201).json({ message: 'Message received', contactId: contact._id });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
