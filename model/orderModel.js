// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  finalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  shippingAddress: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod'],
    default: 'razorpay'
  },
  razorpayOrderId: {
    type: String,
    // Remove sparse: true from here since we're defining the index below
  },
  razorpayPaymentId: {
    type: String,
    sparse: true
  },
  couponCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  notes: {
    type: String,
    trim: true
  },
  trackingNumber: {
    type: String,
    trim: true
  },
  estimatedDelivery: {
    type: Date
  },
  paidAt: {
    type: Date
  },
  shippedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for final amount calculation
orderSchema.virtual('calculatedFinalAmount').get(function() {
  return this.totalAmount - this.discount + this.shippingCharges;
});

// Pre-save middleware to calculate final amount
orderSchema.pre('save', function(next) {
  this.finalAmount = this.totalAmount - this.discount + this.shippingCharges;
  next();
});

// Indexes for better query performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ razorpayOrderId: 1 }, { sparse: true }); // Keep only this one

// Instance methods
orderSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status) && 
         this.paymentStatus !== 'completed';
};

orderSchema.methods.calculateTotal = function() {
  return this.items.reduce((total, item) => total + item.total, 0);
};

// Static methods
orderSchema.statics.getOrderStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$finalAmount' }
      }
    }
  ]);
  
  return stats;
};

orderSchema.statics.findByRazorpayOrderId = function(razorpayOrderId) {
  return this.findOne({ razorpayOrderId });
};

module.exports = mongoose.model('Order', orderSchema);