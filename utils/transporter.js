// utils/transporter.js
const { Resend } = require("resend");

// Use the API key from env
const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = resend;
