
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  bestSeller: {
    type: Boolean,
    default: false
  },
  images: [
    {
      url: { type: String, required: true }, // Image URL (from ImageKit)
      fileName: { type: String }, // Original file name
    },
  ],
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

// Add text index for better search performance
ProductSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', ProductSchema);






