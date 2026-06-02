const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Reservation = require('../models/Reservation');
const { adminAuth } = require('../middleware/adminAuth');
const { emitToAdmin } = require('../utils/socket');
const { sendReservationConfirmation } = require('../utils/notifications');

// Validation middleware array
const validateReservation = [
  check('name', 'Name is required').not().isEmpty().trim().escape(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('phone', 'Phone must be at least 10 digits').isLength({ min: 10 }).trim().escape(),
  check('date', 'Date is required').isISO8601().toDate(),
  check('time', 'Time is required').not().isEmpty().trim().escape(),
  check('guests', 'Guests must be between 1 and 20').isInt({ min: 1, max: 20 })
];

// @route   POST /api/reservations
// @desc    Create a reservation
// @access  Public
router.post('/', validateReservation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return next(new Error(errors.array().map(e => e.msg).join(', ')));
  }

  try {
    const reservation = await Reservation.create(req.body);

    // Real-time notification to admin
    emitToAdmin('newReservation', {
      reservation,
      message: `📅 New reservation from ${reservation.name} - ${reservation.guests} guests - ${reservation.time}`
    });

    // Send email confirmation to customer
    sendReservationConfirmation(reservation);

    res.status(201).json(reservation);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/reservations
// @desc    Get all reservations
// @access  Private/Admin
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const reservations = await Reservation.find({}).sort({ date: 1 });
    res.json(reservations);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/reservations/:id
// @desc    Delete a reservation
// @access  Private/Admin
router.delete('/:id', adminAuth, async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (reservation) {
      await reservation.deleteOne();
      res.json({ message: 'Reservation removed' });
    } else {
      res.status(404);
      throw new Error('Reservation not found');
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
