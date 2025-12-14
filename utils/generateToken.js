const jwt = require("jsonwebtoken");

// JWT Secret - in production, use environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Generate JWT Token with userId for consistency
const generateToken = (id) => {
  return jwt.sign({ userId: id }, JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = { generateToken, JWT_SECRET };



