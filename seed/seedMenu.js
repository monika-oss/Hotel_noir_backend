const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MenuItem = require('../models/MenuItem');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding...');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const menuItems = [
  {
    title: 'Truffle Arancini',
    description: 'Crispy risotto balls infused with black truffle and parmesan.',
    price: 18,
    category: 'Starters',
    image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80',
    isFeatured: true
  },
  {
    title: 'Wagyu Beef Carpaccio',
    description: 'Thinly sliced wagyu beef with capers, lemon, and olive oil.',
    price: 24,
    category: 'Starters',
    image: 'https://images.unsplash.com/photo-1628198622765-4676572a1144?auto=format&fit=crop&q=80',
    isFeatured: false
  },
  {
    title: 'Seared Scallops',
    description: 'Pan-seared Hokkaido scallops with cauliflower purée.',
    price: 22,
    category: 'Starters',
    image: 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?auto=format&fit=crop&q=80',
    isFeatured: false
  },
  {
    title: 'Noir Signature Ribeye',
    description: '45-day dry-aged ribeye steak with gold leaf compound butter.',
    price: 85,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1544025162-8315ea0765c9?auto=format&fit=crop&q=80',
    isFeatured: true
  },
  {
    title: 'Lobster Thermidor',
    description: 'Whole lobster in a rich creamy wine sauce, oven-baked with gruyère.',
    price: 65,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&q=80',
    isFeatured: false
  },
  {
    title: 'Mushroom Risotto',
    description: 'Wild mushroom risotto with 24-month aged parmigiano-reggiano.',
    price: 32,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db378?auto=format&fit=crop&q=80',
    isFeatured: false
  },
  {
    title: 'Gold Leaf Chocolate Dome',
    description: 'Dark chocolate dome filled with raspberry coulis, topped with 24k gold.',
    price: 20,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&q=80',
    isFeatured: true
  },
  {
    title: 'Vanilla Bean Crème Brûlée',
    description: 'Classic French dessert with Madagascar vanilla and caramelized sugar.',
    price: 14,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1473691955023-da1c49c95c78?auto=format&fit=crop&q=80',
    isFeatured: false
  },
  {
    title: 'Tiramisu Noir',
    description: 'Espresso-soaked ladyfingers layered with mascarpone cream.',
    price: 16,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&q=80',
    isFeatured: false
  },
  {
    title: 'Smoked Old Fashioned',
    description: 'Bourbon, bitters, and orange peel, served with hickory smoke.',
    price: 18,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80',
    isFeatured: false
  },
  {
    title: 'Golden Martini',
    description: 'Premium vodka with a hint of vermouth and gold flakes.',
    price: 22,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1575037614876-c3856d44f811?auto=format&fit=crop&q=80',
    isFeatured: false
  },
  {
    title: 'Noir Espresso Martini',
    description: 'Fresh espresso, vodka, and coffee liqueur.',
    price: 18,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1629168936994-37c2fb2dc226?auto=format&fit=crop&q=80',
    isFeatured: false
  }
];

const seedData = async () => {
  try {
    await MenuItem.deleteMany();
    await MenuItem.insertMany(menuItems);
    console.log('Menu Data Imported!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

connectDB().then(() => seedData());
