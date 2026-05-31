const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const { adminAuth } = require('../middleware/adminAuth');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'noir_and_gold',
    allowedFormats: ['jpeg', 'png', 'jpg', 'webp']
  }
});
const upload = multer({ storage: storage });


// @route   GET /api/menu
// @desc    Get all menu items
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const { category, featured } = req.query;
    let query = { isAvailable: true };
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    const menuItems = await MenuItem.find(query);
    res.json(menuItems);
  } catch (error) {
    next(error);
  }
});



// @route   POST /api/menu
// @desc    Create a new menu item
// @access  Private/Admin
router.post('/', adminAuth, upload.single('image'), async (req, res, next) => {
  try {
    const itemData = { ...req.body };
    if (req.file) {
      itemData.image = req.file.path; // Cloudinary URL
    }
    const newItem = new MenuItem(itemData);
    const createdItem = await newItem.save();
    res.status(201).json(createdItem);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/menu/:id
// @desc    Update a menu item
// @access  Private/Admin
router.put('/:id', adminAuth, upload.single('image'), async (req, res, next) => {
  try {
    const itemData = { ...req.body };
    if (req.file) {
      itemData.image = req.file.path; // New Cloudinary URL
    }
    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      itemData,
      { new: true, runValidators: true }
    );
    if (!updatedItem) return res.status(404).json({ message: 'Item not found' });
    res.json(updatedItem);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/menu/:id
// @desc    Delete a menu item
// @access  Private/Admin
router.delete('/:id', adminAuth, async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item removed' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
