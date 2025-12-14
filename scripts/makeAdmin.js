// scripts/makeAdmin.js
const mongoose = require('mongoose');
const User = require('../model/newModel'); // Fixed path consistency
require('dotenv').config();

async function makeUserAdmin(email) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URL);
    console.log('Connected to MongoDB');
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      return;
    }
    
    // Check if user is already admin
    if (user.role === 'admin') {
      console.log('ℹ️ User is already an admin:', user.email);
      return;
    }
    
    // Update user role to admin
    user.role = 'admin';
    await user.save();
    
    console.log('✅ Successfully made', user.email, 'an admin!');
    console.log('User details:', {
      email: user.email,
      role: user.role,
      id: user._id,
      createdAt: user.createdAt
    });
    
  } catch (error) {
    console.error('❌ Error making user admin:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Enhanced script with better error handling
async function removeAdminRole(email) {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      return;
    }
    
    if (user.role !== 'admin') {
      console.log('ℹ️ User is not an admin:', user.email);
      return;
    }
    
    user.role = 'user';
    await user.save();
    
    console.log('✅ Successfully removed admin role from', user.email);
    
  } catch (error) {
    console.error('❌ Error removing admin role:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

// Usage
const action = process.argv[2];
const email = process.argv[3];

if (!action || !email) {
  console.log('Usage:');
  console.log('  Make admin: node scripts/makeAdmin.js make <email>');
  console.log('  Remove admin: node scripts/makeAdmin.js remove <email>');
  console.log('Examples:');
  console.log('  node scripts/makeAdmin.js make admin@example.com');
  console.log('  node scripts/makeAdmin.js remove admin@example.com');
  process.exit(1);
}

if (action === 'make') {
  makeUserAdmin(email);
} else if (action === 'remove') {
  removeAdminRole(email);
} else {
  console.log('Invalid action. Use "make" or "remove"');
  process.exit(1);
}
