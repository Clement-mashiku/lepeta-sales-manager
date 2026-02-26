const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// @route   GET /api/products
// @desc    Get all active products
router.get('/', async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/products
// @desc    Create a new product
router.post('/', async (req, res, next) => {
  try {
    const { name, image, price, cost, priceLocked } = req.body;
    const product = await Product.create({ name, image, price, cost, priceLocked });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/products/:id
// @desc    Update product (name, image, price, cost, priceLocked)
router.put('/:id', async (req, res, next) => {
  try {
    const { name, image, price, cost, priceLocked } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, image, price, cost, priceLocked },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// @route   PATCH /api/products/:id/price
// @desc    Set/lock or unlock price
router.patch('/:id/price', async (req, res, next) => {
  try {
    const { price, priceLocked } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { price, priceLocked },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// @route   PATCH /api/products/:id/cost
// @desc    Update cost only
router.patch('/:id/cost', async (req, res, next) => {
  try {
    const { cost } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { cost },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// @route   PATCH /api/products/:id/image
// @desc    Update product image URL
router.patch('/:id/image', async (req, res, next) => {
  try {
    const { image } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { image },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/products/:id
// @desc    Soft delete product (set isActive: false)
router.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: `Product "${product.name}" deleted successfully` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;