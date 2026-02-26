const express = require('express');
const router = express.Router();
const Sale = require('../models/sale');
const Product = require('../models/product');

// @route   GET /api/sales
// @desc    Get all sales with optional filters
// Query params: productId, startDate, endDate, groupBy (day|week|month)
router.get('/', async (req, res, next) => {
  try {
    const { productId, startDate, endDate } = req.query;
    const filter = {};

    if (productId) filter.productId = productId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const sales = await Sale.find(filter)
      .populate('productId', 'name price cost image')
      .sort({ date: -1 });

    res.json({ success: true, count: sales.length, data: sales });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/sales/stats
// @desc    Get summary stats (totals, today's count, etc.)
router.get('/stats', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [overall, todaySales, productCount] = await Promise.all([
      Sale.aggregate([
        {
          $group: {
            _id: null,
            totalSalesCount: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
            grossRevenue: { $sum: '$total' },
            totalCost: { $sum: '$totalCost' },
            netRevenue: { $sum: '$netProfit' },
          },
        },
      ]),
      Sale.aggregate([
        { $match: { date: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, itemsSoldToday: { $sum: '$quantity' } } },
      ]),
      Product.countDocuments({ isActive: true }),
    ]);

    res.json({
      success: true,
      data: {
        totalProducts: productCount,
        totalSalesCount: overall[0]?.totalSalesCount || 0,
        totalQuantitySold: overall[0]?.totalQuantity || 0,
        grossRevenue: overall[0]?.grossRevenue || 0,
        totalCost: overall[0]?.totalCost || 0,
        netRevenue: overall[0]?.netRevenue || 0,
        itemsSoldToday: todaySales[0]?.itemsSoldToday || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/sales/analytics
// @desc    Get sales grouped by day/week/month for charts
// Query params: productId, groupBy (day|week|month)
router.get('/analytics', async (req, res, next) => {
  try {
    const { productId, groupBy = 'day' } = req.query;
    const matchStage = productId ? { productId: require('mongoose').Types.ObjectId(productId) } : {};

    const groupFormats = {
      day:   { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } },
      week:  { year: { $year: '$date' }, week: { $week: '$date' } },
      month: { year: { $year: '$date' }, month: { $month: '$date' } },
    };

    const analytics = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupFormats[groupBy] || groupFormats.day,
          quantity: { $sum: '$quantity' },
          revenue: { $sum: '$total' },
          netProfit: { $sum: '$netProfit' },
          salesCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } },
    ]);

    res.json({ success: true, groupBy, data: analytics });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/sales/by-product
// @desc    Get total sales grouped by product
router.get('/by-product', async (req, res, next) => {
  try {
    const byProduct = await Sale.aggregate([
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$productName' },
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$total' },
          totalNetProfit: { $sum: '$netProfit' },
          salesCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.json({ success: true, data: byProduct });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/sales/:id
// @desc    Get a single sale record
router.get('/:id', async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('productId', 'name price cost image');
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/sales
// @desc    Record a new sale
router.post('/', async (req, res, next) => {
  try {
    const { productId, quantity, notes } = req.body;

    // Fetch live product data
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (!product.priceLocked) return res.status(400).json({ success: false, message: 'Product price must be set before recording a sale' });

    const sale = await Sale.create({
      productId: product._id,
      productName: product.name,
      price: product.price,
      cost: product.cost || 0,
      quantity,
      total: product.price * quantity,
      totalCost: (product.cost || 0) * quantity,
      netProfit: (product.price - (product.cost || 0)) * quantity,
      date: new Date(),
      notes,
    });

    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/sales/:id
// @desc    Delete a sale record
router.delete('/:id', async (req, res, next) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.json({ success: true, message: 'Sale record deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;