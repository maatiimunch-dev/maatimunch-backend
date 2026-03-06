const User = require("../model/newModel");
const validator = require("validator");
const { generateToken } = require("../utils/generateToken.js");
const transporter = require("../utils/transporter.js");

/* ===============================
   REGISTER
================================ */
const registerUser = async (req, res) => {
  try {
    const {
      State,
      name,
      phone,
      city,
      Address,
      Pincode,
      email,
      password,
      role
    } = req.body;

    // Required checks
    if (!name || !phone || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, email and password are required",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check existing user - only block if BOTH email AND phone are same
    const existingUser = await User.findOne({ email, phone });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email and phone combination already exists",
      });
    }

    const user = await User.create({
      State,
      name,
      phone,
      city,
      Address,
      Pincode,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'user', // safe role assign
    });

    // res.status(201).json({
    //   success: true,
    //   message: "User registered successfully",
    //   user: {
    //     id: user._id,
    //     name: user.name,
    //     email: user.email,
    //     role: user.role,
    //   },
    // });


    const token = generateToken(user._id);

res.status(201).json({
  success: true,
  message: "User registered successfully",
  token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  },
});

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ===============================
   LOGIN
================================ */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({
        success: false,
        message: "Email & password required",
      });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        State: user.State,
        city: user.city,
      },
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ===============================
   SEND OTP
================================ */
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Send OTP Request for:", email);

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.resetOtp = otp;
    user.resetOtpExpire = Date.now() + 6 * 60 * 1000;
    user.resetTokenUsed = false;
    await user.save();

    await transporter.emails.send({
      from: "MaatiMunch <no-reply@maatimunch.in>",
      to: email,
      subject: "Password Reset OTP",
      html: `<p>Your OTP is <b>${otp}</b>. It expires in 6 minutes.</p>`,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully. Check your email.",
    });

  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ===============================
   VERIFY OTP
================================ */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    if (
      user.resetOtp !== Number(otp) ||
      user.resetOtpExpire < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.resetTokenUsed = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });

  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ===============================
   RESET PASSWORD
================================ */
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!newPassword || newPassword !== confirmPassword)
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });

    const user = await User.findOne({ email });
    if (!user || !user.resetTokenUsed)
      return res.status(400).json({
        success: false,
        message: "OTP verification required",
      });

    user.password = newPassword;
    user.resetTokenUsed = false;
    user.resetOtp = undefined;
    user.resetOtpExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });

  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ===============================
   PROFILE
================================ */
const getUserProfile = (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

/* ===============================
   GET ALL USERS (ADMIN)
================================ */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
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

