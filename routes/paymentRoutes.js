// // routes/paymentRoutes.js
// const express = require('express');
// const Razorpay = require('razorpay');
// const crypto = require('crypto');
// const { body, validationResult } = require('express-validator');
// const Order = require('../model/orderModel');
// const Product = require('../model/productModel');
// const { protect } = require('../middleware/authMiddleware');
// const { requireAdmin } = require('../middleware/adminMiddleware');

// const auth = protect;
// const router = express.Router();

// // ... (keep all your existing routes like create-order, verify-payment, webhook)

// // REGULAR USER ROUTES (existing) 
// // Get user's own orders
// router.get('/orders', auth, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     const orders = await Order.find({ userId })
//       .populate('items.productId', 'name images')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     const total = await Order.countDocuments({ userId });

//     res.json({
//       success: true,
//       data: {
//         orders,
//         pagination: {
//           page,
//           limit,
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get orders error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch orders'
//     });
//   }
// });

// // Get user's specific order
// router.get('/order/:orderId', auth, async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const userId = req.user.id;

//     const order = await Order.findOne({ _id: orderId, userId })
//       .populate('items.productId', 'name images');

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     res.json({
//       success: true,
//       data: order
//     });
//   } catch (error) {
//     console.error('Get order error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch order'
//     });
//   }
// });

// // ADMIN ROUTES (new)
// // Get ALL orders (admin only)
// router.get('/admin/orders', auth, requireAdmin, async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;
    
//     // Optional filters
//     const filters = {};
//     if (req.query.status) filters.status = req.query.status;
//     if (req.query.paymentStatus) filters.paymentStatus = req.query.paymentStatus;
//     if (req.query.userId) filters.userId = req.query.userId;
//     if (req.query.search) {
//       filters.$or = [
//         { 'shippingAddress.name': { $regex: req.query.search, $options: 'i' } },
//         { 'shippingAddress.phone': { $regex: req.query.search, $options: 'i' } }
//       ];
//     }

//     const orders = await Order.find(filters)
//       .populate('items.productId', 'name images')
//       .populate('userId', 'email')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     const total = await Order.countDocuments(filters);

//     res.json({
//       success: true,
//       data: {
//         orders,
//         pagination: {
//           page,
//           limit,
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Admin get orders error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch orders'
//     });
//   }
// });

// // Get ANY order by ID (admin only)
// router.get('/admin/order/:orderId', auth, requireAdmin, async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     const order = await Order.findById(orderId)
//       .populate('items.productId', 'name images')
//       .populate('userId', 'email');

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     res.json({
//       success: true,
//       data: order
//     });
//   } catch (error) {
//     console.error('Admin get order error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch order'
//     });
//   }
// });

// // Update order status (admin only)
// router.patch('/admin/order/:orderId/status', auth, requireAdmin, [
//   body('status')
//     .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
//     .withMessage('Invalid status')
// ], async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: errors.array()
//       });
//     }

//     const { orderId } = req.params;
//     const { status } = req.body;

//     const order = await Order.findById(orderId);
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     order.status = status;
//     if (status === 'delivered') {
//       order.deliveredAt = new Date();
//     }
    
//     await order.save();

//     res.json({
//       success: true,
//       message: 'Order status updated successfully',
//       data: order
//     });
//   } catch (error) {
//     console.error('Update order status error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update order status'
//     });
//   }
// });

// // Get order statistics (admin only)
// router.get('/admin/stats', auth, requireAdmin, async (req, res) => {
//   try {
//     const stats = await Order.aggregate([
//       {
//         $group: {
//           _id: null,
//           totalOrders: { $sum: 1 },
//           totalRevenue: { $sum: '$finalAmount' },
//           completedOrders: {
//             $sum: {
//               $cond: [{ $eq: ['$paymentStatus', 'completed'] }, 1, 0]
//             }
//           },
//           pendingOrders: {
//             $sum: {
//               $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0]
//             }
//           },
//           failedOrders: {
//             $sum: {
//               $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0]
//             }
//           }
//         }
//       }
//     ]);

//     const statusStats = await Order.aggregate([
//       {
//         $group: {
//           _id: '$status',
//           count: { $sum: 1 }
//         }
//       }
//     ]);

//     res.json({
//       success: true,
//       data: {
//         overview: stats[0] || {
//           totalOrders: 0,
//           totalRevenue: 0,
//           completedOrders: 0,
//           pendingOrders: 0,
//           failedOrders: 0
//         },
//         statusBreakdown: statusStats
//       }
//     });
//   } catch (error) {
//     console.error('Get stats error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch statistics'
//     });
//   }
// });

// module.exports = router;
// routes/paymentRoutes.js
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const Order = require('../model/orderModel');
const Product = require('../model/productModel');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

const auth = protect;
const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// CREATE ORDER ROUTE
router.post('/create-order', auth, [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),
  body('items.*.productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('shippingAddress.name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('shippingAddress.phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone must be 10 digits'),
  body('shippingAddress.address')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Address must be at least 10 characters'),
  body('shippingAddress.city')
    .trim()
    .isLength({ min: 2 })
    .withMessage('City is required'),
  body('shippingAddress.state')
    .trim()
    .isLength({ min: 2 })
    .withMessage('State is required'),
  body('shippingAddress.pincode')
    .matches(/^[0-9]{6}$/)
    .withMessage('Pincode must be 6 digits')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { items, shippingAddress, couponCode } = req.body;
    const userId = req.user.id;

    // Verify products exist and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }

    // Calculate shipping charges (matching your schema field name)
    const shippingCharges = totalAmount >= 1000 ? 0 : 50;
    const finalAmount = totalAmount + shippingCharges;

    // Create Razorpay order
    const razorpayOrderOptions = {
      amount: finalAmount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      payment_capture: 1
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);

    // Create order in database (matching your Order schema)
    const order = new Order({
      userId,
      items: orderItems,
      totalAmount,
      discount: 0, // Default discount
      shippingCharges, // Using correct field name from schema
      finalAmount,
      shippingAddress,
      couponCode: couponCode || undefined,
      razorpayOrderId: razorpayOrder.id,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'razorpay'
    });

    await order.save();

    // Return order data for frontend
    res.status(201).json({
      success: true,
      data: {
        orderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        amount: finalAmount,
        currency: 'INR',
        createdAt: order.createdAt,
        key: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

// VERIFY PAYMENT ROUTE
// VERIFY PAYMENT ROUTE (Updated)
router.post('/verify-payment', auth, [
  body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Razorpay signature is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Find order and populate all necessary data
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id })
      .populate('items.productId', 'name images'); // Populate product details

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order with payment details
    order.paymentStatus = 'completed';
    order.razorpayPaymentId = razorpay_payment_id;
    order.paidAt = new Date();
    order.status = 'confirmed';

    await order.save();

    // Update product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Return complete order data for frontend
    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        // Add complete order information
        orderData: {
          _id: order._id,
          totalAmount: order.totalAmount,
          shippingCharges: order.shippingCharges,
          finalAmount: order.finalAmount,
          amount: order.finalAmount, // This is what OrderSuccess component expects
          createdAt: order.createdAt,
          shippingAddress: order.shippingAddress,
          items: order.items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            images: item.productId?.images || [], // From populated data
            total: item.total
          })),
          paymentMethod: order.paymentMethod,
          couponCode: order.couponCode
        }
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

// WEBHOOK ROUTE (for Razorpay webhooks)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = JSON.parse(body);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        // Handle successful payment
        const paymentId = event.payload.payment.entity.id;
        const orderId = event.payload.payment.entity.order_id;
        
        await Order.findOneAndUpdate(
          { razorpayOrderId: orderId },
          { 
            paymentStatus: 'completed',
            razorpayPaymentId: paymentId,
            paidAt: new Date(),
            status: 'confirmed'
          }
        );
        break;

      case 'payment.failed':
        // Handle failed payment
        const failedOrderId = event.payload.payment.entity.order_id;
        await Order.findOneAndUpdate(
          { razorpayOrderId: failedOrderId },
          { paymentStatus: 'failed' }
        );
        break;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

// REGULAR USER ROUTES (existing) 
// Get user's own orders
router.get('/orders', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId })
      .populate('items.productId', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Get user's specific order
router.get('/order/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, userId })
      .populate('items.productId', 'name images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
});

// Cancel order
router.patch('/order/:orderId/cancel', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled'
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
});

// ADMIN ROUTES (existing)
// Get ALL orders (admin only)
router.get('/admin/orders', auth, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Optional filters
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.paymentStatus) filters.paymentStatus = req.query.paymentStatus;
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.search) {
      filters.$or = [
        { 'shippingAddress.name': { $regex: req.query.search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(filters)
      .populate('items.productId', 'name images')
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filters);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Get ANY order by ID (admin only)
router.get('/admin/order/:orderId', auth, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('items.productId', 'name images')
      .populate('userId', 'email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Admin get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
});

// Update order status (admin only)
router.patch('/admin/order/:orderId/status', auth, requireAdmin, [
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    } else if (status === 'shipped') {
      order.shippedAt = new Date();
    }
    
    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// Get order statistics (admin only)
router.get('/admin/stats', auth, requireAdmin, async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'completed'] }, 1, 0]
            }
          },
          pendingOrders: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0]
            }
          },
          failedOrders: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          completedOrders: 0,
          pendingOrders: 0,
          failedOrders: 0
        },
        statusBreakdown: statusStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;