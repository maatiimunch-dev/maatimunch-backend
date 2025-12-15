const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  State: String,
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },  
  city: String,
  Address: String,
  Pincode: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  resetOtp: Number,
  resetOtpExpire: Date,
  resetTokenUsed: { type: Boolean, default: false },
});

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(String(this.password), 10);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (plainPassword) {
  return await bcrypt.compare(String(plainPassword), this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
