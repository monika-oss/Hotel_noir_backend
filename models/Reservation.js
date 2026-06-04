const mongoose = require('mongoose');

const reservationSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  guests: { type: Number, required: true, min: 1, max: 20 },
  specialRequests: { type: String },
  status: { type: String, enum: ['upcoming', 'seated', 'completed', 'cancelled'], default: 'upcoming' },
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
