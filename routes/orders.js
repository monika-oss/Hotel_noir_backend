const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createOrder, getOrders, updateOrderStatus } = require('../controllers/orderController');
const { createRazorpayOrder, verifyPaymentAndCreateOrder } = require('../controllers/paymentController');
const { adminAuth } = require('../middleware/adminAuth');

router.post('/', [
  body('customerName').trim().escape().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('phone').trim().escape().notEmpty(),
  body('tableNumber').trim().escape().notEmpty(),
  body('items').isArray({ min: 1 }),
  body('totalAmount').isNumeric()
], createOrder);

router.get('/', adminAuth, getOrders);
router.put('/:id/status', adminAuth, updateOrderStatus);

// Payment Routes
router.post('/create-payment', createRazorpayOrder);
router.post('/verify-payment', verifyPaymentAndCreateOrder);

module.exports = router;
