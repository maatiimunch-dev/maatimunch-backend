// const express = require('express');
// const expressListRoutes = require('express-list-routes');
// const cors = require("cors");
// const mongoose = require("mongoose");
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const mongoSanitize = require('express-mongo-sanitize');
// require("dotenv").config();

// // ENV VARIABLES
// const MONGODB_URL = process.env.DB_URL;
// const PORT = process.env.PORT || 8080;

// const app = express();

// /* --------------------------------------------
//    🛡 SECURITY - HELMET (FIXED FOR LOCALHOST)
// --------------------------------------------- */
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         scriptSrc: [
//           "'self'",
//           "'unsafe-inline'",
//           "https://checkout.razorpay.com"
//         ],
//         styleSrc: ["'self'", "'unsafe-inline'"],
//         imgSrc: ["'self'", "data:", "https:"],
//         connectSrc: [
//           "'self'",
//           "https://api.razorpay.com",
//           "http://localhost:5173",
//           "http://localhost:5174",
//           "http://localhost:5175",
//           "http://localhost:8000"
//         ],
//         frameSrc: ["https://api.razorpay.com"]
//       },
//     },
//   })
// );

// /* --------------------------------------------
//    🚦 RATE LIMITING
// --------------------------------------------- */
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 200,
//   message: 'Too many requests, try again later.'
// });
// app.use(limiter);

// /* --------------------------------------------
//    🚦 PAYMENT LIMIT
// --------------------------------------------- */
// const paymentLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 50,
//   message: 'Too many payment requests, try again later.'
// });

// /* --------------------------------------------
//    🛡 SANITIZE DATA
// --------------------------------------------- */
// app.use(mongoSanitize());

// /* --------------------------------------------
//    🌐 CORS (FULLY FIXED)
// --------------------------------------------- */
// const allowedOrigins = [
//   'http://localhost:5173',
//   'http://localhost:5174',
//   'http://localhost:5175',
//   'https://maatimunch-fronted.onrender.com',
//   'https://maatimunch-dashboard.onrender.com',
//   'https://www.maatimunch.in',
// ];

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     } else {
//       return callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// // 🔥 FIX FOR RENDER BLOCKING PREFLIGHT REQUESTS
// app.options('*', cors());

// /* --------------------------------------------
//    📦 BODY PARSER
// --------------------------------------------- */
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// /* --------------------------------------------
//    📌 ROUTES
// --------------------------------------------- */
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/categories', require('./routes/categoryRoutes'));
// app.use('/api/products', require('./routes/productRoutes'));
// app.use('/api/payments', paymentLimiter, require('./routes/paymentRoutes'));
// app.use('/api/blogs', require('./routes/blogRoutes'));

// app.get('/', (req, res) => {
//   res.json({ message: 'Secure API running 🚀' });
// });

// /* --------------------------------------------
//    ❌ 404 HANDLER
// --------------------------------------------- */
// app.use('*', (req, res) => {
//   res.status(404).json({ success: false, message: 'Route not found' });
// });

// /* --------------------------------------------
//    🛢 DATABASE
// --------------------------------------------- */
// // mongoose.connect(MONGODB_URL, { serverSelectionTimeoutMS: 10000 })
// //   .then(() => console.log('MongoDB Connected Successfully ✔'))
// //   .catch((err) => {
// //     console.error('MongoDB Connection Error:', err);
// //     process.exit(1);
// //   });
  

// mongoose.connect(MONGODB_URL, { serverSelectionTimeoutMS: 10000 })
//   .then(async () => {
//     console.log('MongoDB Connected Successfully ✔');

//     // ✅ DROP phone_1 INDEX - SIRF EK BAAR CHALEGA
//     try {
//       await mongoose.connection.collection("users").dropIndex("phone_1");
//       console.log("✅ phone_1 index dropped!");
//     } catch (e) {
//       console.log("ℹ️ phone_1 index already removed or not found — skipping");
//     }

//   })
//   .catch((err) => {
//     console.error('MongoDB Connection Error:', err);
//     process.exit(1);
//   });
// /* --------------------------------------------
//    🛑 GRACEFUL SHUTDOWN   
// --------------------------------------------- */
// process.on('SIGINT', async () => {
//   console.log('Shutting down...');
//   await mongoose.connection.close();
//   process.exit(0);
// });

// /* --------------------------------------------
//    🚀 START SERVER
// --------------------------------------------- */
// expressListRoutes(app);
// app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));




const express = require('express');
const expressListRoutes = require('express-list-routes');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression'); // NEW: gzip compression
require('dotenv').config();

const MONGODB_URL = process.env.DB_URL;
const PORT = process.env.PORT || 8080;

const app = express();

/* ─────────────────────────────────────────
   🗜️ GZIP COMPRESSION (reduces response size)
──────────────────────────────────────────── */
app.use(compression());

/* ─────────────────────────────────────────
   🛡 HELMET (security headers)
──────────────────────────────────────────── */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://checkout.razorpay.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'",
          'https://api.razorpay.com',
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:5175',
          'http://localhost:8000',
        ],
        frameSrc: ['https://api.razorpay.com'],
      },
    },
  })
);

/* ─────────────────────────────────────────
   🚦 GLOBAL RATE LIMITING (100 req / 15 min)
──────────────────────────────────────────── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

/* ─────────────────────────────────────────
   🚦 PAYMENT RATE LIMITER (stricter)
──────────────────────────────────────────── */
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many payment requests, try again later.' },
});

/* ─────────────────────────────────────────
   🛡 MONGO SANITIZE
──────────────────────────────────────────── */
app.use(mongoSanitize());

/* ─────────────────────────────────────────
   🌐 CORS
──────────────────────────────────────────── */
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://maatimunch-fronted.onrender.com',
  'https://maatimunch-dashboard.onrender.com',
  'https://www.maatimunch.in',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.options('*', cors()); // preflight

/* ─────────────────────────────────────────
   📦 BODY PARSER
──────────────────────────────────────────── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ─────────────────────────────────────────
   📌 ROUTES
──────────────────────────────────────────── */
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/payments', paymentLimiter, require('./routes/paymentRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'Secure API running 🚀' });
});

/* ─────────────────────────────────────────
   ❌ 404 HANDLER
──────────────────────────────────────────── */
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

/* ─────────────────────────────────────────
   🛢 DATABASE
──────────────────────────────────────────── */
mongoose
  .connect(MONGODB_URL, { serverSelectionTimeoutMS: 10000 })
  .then(async () => {
    console.log('MongoDB Connected Successfully ✔');

    try {
      await mongoose.connection.collection('users').dropIndex('phone_1');
      console.log('✅ phone_1 index dropped!');
    } catch (e) {
      console.log('ℹ️ phone_1 index already removed — skipping');
    }
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

/* ─────────────────────────────────────────
   🛑 GRACEFUL SHUTDOWN
──────────────────────────────────────────── */
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await mongoose.connection.close();
  process.exit(0);
});

/* ─────────────────────────────────────────
   🚀 START SERVER
──────────────────────────────────────────── */
expressListRoutes(app);
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));