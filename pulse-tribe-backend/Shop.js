// ===== models/Shop.js =====
const mongoose = require('mongoose');

// ── Product ───────────────────────────────────────────
const ProductSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    description: { type: String },
    price:       { type: Number, required: true },   // in ETB
    category:    { type: String, enum: ['Equipment', 'Supplements', 'Clothes'], required: true },
    image:       { type: String, default: '' },
    stock:       { type: Number, default: 0 },
    rating:      { type: Number, default: 0 },
    numReviews:  { type: Number, default: 0 }
  },
  { timestamps: true }
);

// ── Order ─────────────────────────────────────────────
const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name:     { type: String },
        price:    { type: Number },
        quantity: { type: Number, default: 1 }
      }
    ],
    totalPrice:     { type: Number, required: true },
    status:         { type: String, enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    shippingAddress: {
      address: { type: String },
      city:    { type: String },
      phone:   { type: String }
    },
    paidAt:      { type: Date },
    deliveredAt: { type: Date }
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', ProductSchema);
const Order   = mongoose.model('Order',   OrderSchema);

module.exports = { Product, Order };
