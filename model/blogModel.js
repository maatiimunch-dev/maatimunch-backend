const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    url: { 
      type: String, 
      required: true 
    },
    fileName: { 
      type: String 
    },
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

// Auto-generate slug from title before saving
BlogSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/--+/g, '-') // Replace multiple hyphens with single
      .trim();
  }
  next();
});

// Add text index for search
BlogSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Blog', BlogSchema);