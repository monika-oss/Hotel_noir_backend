const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const { sendOrderConfirmation } = require('../utils/notifications');

exports.createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { customerName, email, phone, tableNumber, items, totalAmount } = req.body;
    
    const newOrder = new Order({
      customerName,
      email,
      phone,
      tableNumber,
      items,
      totalAmount
    });

    const savedOrder = await newOrder.save();
    
    // Trigger asynchronous notifications
    sendOrderConfirmation(savedOrder);
    
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
