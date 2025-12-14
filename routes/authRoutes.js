// const express = require("express");
// const router = express.Router();
// const {
//   registerUser,
//   loginUser,
//   getUserProfile,
//   getAllUsers,
//   sendOtp,
//   verifyOtp,
//   resetPassword,
// } = require("../controller/authController.js");

// const { protect } = require("../middleware/authMiddleware");

// // Auth routes
// router.post("/register", registerUser);
// router.post("/login", loginUser);
//     router.get("/profile", protect, getUserProfile);
//  router.get("/users", getAllUsers);

// module.exports = router;






const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware.js');
const {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  resetPassword,
  getUserProfile,
  getAllUsers
} = require('../controller/authController.js');

// Auth routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

router.get('/profile', protect, getUserProfile);
router.get('/users', getAllUsers);

module.exports = router;
