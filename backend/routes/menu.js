const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

// GET all menu items
router.get('/', async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isAvailable: true };
    const items = await MenuItem.find(filter).sort({ createdAt: -1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create menu item
router.post('/', async (req, res) => {
  try {
    const item = new MenuItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH update menu item
router.patch('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Menu item not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE menu item
router.delete('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Menu item not found' });
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST seed menu items (run once to populate)
router.post('/seed', async (req, res) => {
  try {
    await MenuItem.deleteMany({});
    const items = [
      { name: 'Margherita Pizza', description: 'Classic tomato & mozzarella', price: 299, category: 'Pizza', image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400' },
      { name: 'Pepperoni Pizza', description: 'Loaded with pepperoni slices', price: 399, category: 'Pizza', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400' },
      { name: 'Veg Burger', description: 'Crispy veg patty with fresh veggies', price: 149, category: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
      { name: 'Chicken Burger', description: 'Juicy chicken patty with secret sauce', price: 199, category: 'Burgers', image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400' },
      { name: 'Pasta Arrabbiata', description: 'Spicy tomato pasta', price: 249, category: 'Pasta', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400' },
      { name: 'Alfredo Pasta', description: 'Creamy white sauce pasta', price: 279, category: 'Pasta', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400' },
      { name: 'French Fries', description: 'Crispy golden fries with dip', price: 99, category: 'Sides', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400' },
      { name: 'Garlic Bread', description: 'Toasted garlic butter bread', price: 79, category: 'Sides', image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400' },
      { name: 'Chocolate Lava Cake', description: 'Warm molten chocolate dessert', price: 149, category: 'Desserts', image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400' },
      { name: 'Cold Coffee', description: 'Chilled creamy cold coffee', price: 129, category: 'Drinks', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400' },
    ];
    const created = await MenuItem.insertMany(items);
    res.json({ message: 'Menu seeded!', count: created.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
