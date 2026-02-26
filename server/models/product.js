const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [50, 'Product name cannot exceed 50 characters'],
    },
    image: {
      type: String,
      default: 'https://via.placeholder.com/400x250?text=No+Image',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      max: [999999, 'Price cannot exceed 999,999'],
      default: 0,
    },
    cost: {
      type: Number,
      min: [0, 'Cost cannot be negative'],
      max: [999999, 'Cost cannot exceed 999,999'],
      default: 0,
    },
    priceLocked: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: profit margin percentage
productSchema.virtual('profitMargin').get(function () {
  if (this.price === 0) return 0;
  return (((this.price - this.cost) / this.price) * 100).toFixed(2);
});

// Virtual: unit profit
productSchema.virtual('unitProfit').get(function () {
  return (this.price - this.cost).toFixed(2);
});

// Indexes for faster queries
productSchema.index({ name: 1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;