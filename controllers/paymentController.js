const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const { sendOrderConfirmation } = require('../utils/notifications');
const { emitToAdmin } = require('../utils/socket');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Helper to load env since we are adding keys dynamically
const loadEnvConfig = () => {
  const envPath = path.resolve(__dirname, '../.env');
  let envConfig = { ...process.env };
  if (fs.existsSync(envPath)) {
    const parsed = dotenv.parse(fs.readFileSync(envPath));
    envConfig = { ...envConfig, ...parsed };
  }
  return envConfig;
};

// Create a razorpay order (Step 1)
exports.createRazorpayOrder = async (req, res) => {
  const envConfig = loadEnvConfig();
  
  if (!envConfig.RAZORPAY_KEY_ID || !envConfig.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ message: 'Razorpay keys not configured' });
  }

  try {
    const { totalAmount } = req.body;
    
    // Razorpay amount is in paise (multiply by 100)
    const amountInPaise = Math.round(totalAmount * 100);

    const razorpay = new Razorpay({
      key_id: envConfig.RAZORPAY_KEY_ID,
      key_secret: envConfig.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amountInPaise,
      currency: "INR", // Change to INR if you want to accept INR
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error('Razorpay Error:', error);
    res.status(500).json({ message: 'Something went wrong while creating Razorpay order' });
  }
};

// Verify payment and save Order to database (Step 2)
exports.verifyPaymentAndCreateOrder = async (req, res) => {
  const envConfig = loadEnvConfig();
  
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderDetails 
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", envConfig.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is authentic! Create the hotel Noir order
      const newOrder = new Order({
        ...orderDetails,
        paymentStatus: 'paid',
        paymentMethod: 'razorpay',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id
      });

      const savedOrder = await newOrder.save();

      // Emit to admin dashboard
      emitToAdmin('newOrder', {
        order: savedOrder,
        message: `🍽️ New PAID order from ${savedOrder.customerName} - Table ${savedOrder.tableNumber} - ₹${savedOrder.totalAmount.toFixed(2)}`
      });

      // Send email/WhatsApp confirmation
      sendOrderConfirmation(savedOrder);

      return res.status(200).json({ message: "Payment verified successfully", order: savedOrder });
    } else {
      return res.status(400).json({ message: "Invalid signature sent!" });
    }
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
