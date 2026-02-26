const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    productName: {
      type: String,
      required: [true, 'Product name snapshot is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Sale price is required'],
      min: [0, 'Price cannot be negative'],
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [99999, 'Quantity cannot exceed 99,999'],
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative'],
    },
    totalCost: {
      type: Number,
      default: 0,
      min: [0, 'Total cost cannot be negative'],
    },
    netProfit: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook: auto-calculate totals if not provided
saleSchema.pre('save', function (next) {
  this.total = this.price * this.quantity;
  this.totalCost = this.cost * this.quantity;
  this.netProfit = this.total - this.totalCost;
  next();
});

// Indexes for analytics queries
saleSchema.index({ productId: 1 });
saleSchema.index({ date: -1 });
saleSchema.index({ date: 1, productId: 1 });
saleSchema.index({ createdAt: -1 });

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;