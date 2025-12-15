const User = require("../model/newModel");
const validator = require("validator");
const { generateToken } = require("../utils/generateToken.js");
const transporter = require("../utils/transporter.js"); // Resend

// ===============================
// REGISTER
// ===============================
const registerUser = async (req, res) => {
  try {
    const { State, city, Address, Pincode, email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email & password required" });

    if (!validator.isEmail(email))
      return res.status(400).json({ success: false, message: "Invalid email" });

    if (password.length < 6)
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 6 chars" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });

    const user = await User.create({
      State,
      city,
      Address,
      Pincode,
      email,
      password,
    });

    res
      .status(201)
      .json({
        success: true,
        message: "User registered",
        user: { id: user._id, email: user.email },
      });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ===============================
// LOGIN
// ===============================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email & password required" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const token = generateToken(user._id);

    res.status(200).json({
  success: true,
  message: "Login successful",
  token,
  user: {
    id: user._id,
    email: user.email,
    State: user.State,
    city: user.city,
    role: user.role,   
  },
});

  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ===============================
// SEND OTP
// ===============================


// const sendOtp = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user)
//       return res.status(404).json({ success: false, message: "User not found" });

//     // Generate OTP
//     const otp = Math.floor(100000 + Math.random() * 900000);
//     user.resetOtp = otp;
//     user.resetOtpExpire = Date.now() + 6 * 60 * 1000; // 6 mins
//     user.resetTokenUsed = false;
//     await user.save();

//     // Send OTP via Resend
//     const response = await transporter.emails.send({
//       from: "Shubham Musical <no-reply@shubhammusicalpalace2@gmail.com>", // must be verified
//       to: email, // <-- user email
//       subject: "Password Reset OTP",
//       text: `Your OTP is ${otp}. It expires in 6 minutes.`,
//       html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 6 minutes.</p>`,
//     });

//     console.log("Resend response:", response);

//     res.status(200).json({
//       success: true,
//       message: "OTP sent to email. Check your inbox or spam folder.",
//     });
//   } catch (err) {
//     console.error("Send OTP Error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error while sending OTP",
//       error: err.message,
//     });
//   }
// };

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.resetOtp = otp;
    user.resetOtpExpire = Date.now() + 6 * 60 * 1000; // 6 mins
    user.resetTokenUsed = false;
    await user.save();

    // Send OTP via Resend
    const response = await transporter.emails.send({
      from: "Shubham Musical <no-reply@shubhammusicals.com>", 
      to: email,
      subject: "Password Reset OTP",
      html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 6 minutes.</p>`,
    });

    console.log("Resend response:", response);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (err) {
    console.error("Send OTP Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while sending OTP",
      error: err.message,
    });
  }
};



// ===============================
// VERIFY OTP
// ===============================
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (user.resetOtp !== Number(otp))
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    if (user.resetOtpExpire < Date.now())
      return res.status(400).json({ success: false, message: "OTP expired" });

    user.resetTokenUsed = true;
    await user.save();

    res
      .status(200)
      .json({
        success: true,
        message: "OTP verified. You can reset password now.",
      });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ===============================
// RESET PASSWORD
// ===============================
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword)
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });
    if (newPassword !== confirmPassword)
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (!user.resetTokenUsed)
      return res
        .status(400)
        .json({ success: false, message: "Verify OTP first!" });

    user.password = newPassword; // hashed automatically
    user.resetTokenUsed = false;
    user.resetOtp = undefined;
    user.resetOtpExpire = undefined;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ===============================
// PROFILE
// ===============================
const getUserProfile = (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

// ===============================
// GET ALL USERS
// ===============================
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "email createdAt");
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  resetPassword,
  getUserProfile,
  getAllUsers,
};
