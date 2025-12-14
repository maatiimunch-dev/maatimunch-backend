const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin, requireRole, requireAnyRole } = require('../middleware/adminMiddleware');
const User = require('../model/newModel');

const router = express.Router();

// Admin dashboard - requires admin role
router.get('/dashboard', protect, requireAdmin, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    res.json({
      success: true,
      data: {
        message: 'Welcome to admin dashboard',
        stats: {
          totalUsers: userCount,
          totalAdmins: adminCount,
          currentUser: {
            email: req.user.email,
            role: req.user.role
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get all users - admin only
router.get('/users', protect, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update user role - admin only
router.patch('/users/:userId/role', protect, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    // Validate role
    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Moderator only route example
router.get('/moderate', protect, requireRole('moderator'), (req, res) => {
  res.json({
    success: true,
    message: 'Moderator access granted'
  });
});

// Admin or moderator route example
router.get('/manage', protect, requireAnyRole(['admin', 'moderator']), (req, res) => {
  res.json({
    success: true,
    message: 'Admin or moderator access granted'
  });
});

module.exports = router;
