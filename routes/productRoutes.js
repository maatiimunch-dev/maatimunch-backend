// const express = require('express');
// const { 
//   createProduct, 
//   fetchProduct, 
//   fetchSingleProduct, // Add this new function
//   editProduct, 
//   deleteProduct,
//   addToCart, 
//   getCart,   
//   updateCartQuantity,   
//   removeFromCart,   
//   clearCart,
//   searchProducts, // New advanced search   
//   searchAutocomplete 
// } = require('../controller/productController');
// const upload = require('../middleware/multer');

// const router = express.Router();

// router.post('/add', upload.array('images', 5), createProduct);
// router.get('/fetch', fetchProduct);
// // Add this new route for fetching single product by ID
// router.get('/single/:id', fetchSingleProduct);
// router.put('/edit/:id', upload.array('images', 5), editProduct);
// router.delete('/delete/:id', deleteProduct);
// router.get('/autocomplete', searchAutocomplete);
// router.post('/add-to-cart', addToCart);
// router.get('/:userId', getCart);
// router.put('/update', updateCartQuantity);
// router.delete('/remove', removeFromCart);
// router.delete('/clear', clearCart);

// module.exports = router;









// const express = require('express');
// const router = express.Router();

// const {
//   createProduct,
//   fetchProduct,
//   editProduct,
//   deleteProduct,
//   addToCart,
//   getCart,
//   updateCartQuantity,
//   removeFromCart,
//   clearCart,
//   getProductById,
//   fetchSingleProduct,
//   searchProducts,
//   searchAutocomplete,
// } = require('../controller/productController');

// const { protect } = require('../middleware/authMiddleware');
// const { requireAdmin } = require('../middleware/adminMiddleware');
// const upload = require('../middleware/multer');
// const { cacheMiddleware } = require('../middleware/cacheMiddleware');

// // ─── Public Routes ────────────────────────────────────────────────────────────

// // Products list — cache key includes query string for pagination/filter awareness
// router.get(
//   '/',
//   cacheMiddleware((req) => `products:${JSON.stringify(req.query)}`, 3600),
//   fetchProduct
// );

// // Single product by ID
// router.get(
//   '/:id',
//   cacheMiddleware((req) => `product:${req.params.id}`, 3600),
//   fetchSingleProduct
// );

// // Search with Redis caching (handled inside controller)
// router.get('/search/query', searchProducts);

// // Autocomplete (cached inside controller)
// router.get('/search/autocomplete', searchAutocomplete);

// // ─── Protected Admin Routes ───────────────────────────────────────────────────

// router.post('/', protect, requireAdmin, upload.array('images'), createProduct);
// router.put('/:id', protect, requireAdmin, upload.array('images'), editProduct);
// router.delete('/:id', protect, requireAdmin, deleteProduct);

// // ─── Cart Routes (authenticated users) ───────────────────────────────────────

// router.post('/cart/add', protect, addToCart);
// router.get('/cart/:userId', protect, getCart);
// router.put('/cart/update', protect, updateCartQuantity);
// router.delete('/cart/remove', protect, removeFromCart);
// router.delete('/cart/clear', protect, clearCart);

// module.exports = router;






const express = require('express');
const router = express.Router();

const {
  createProduct, fetchProduct, editProduct, deleteProduct,
  addToCart, getCart, updateCartQuantity, removeFromCart, clearCart,
  getProductById, fetchSingleProduct, searchProducts, searchAutocomplete,
} = require('../controller/productController');

const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const upload = require('../middleware/multer');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

// ⚠️ SPECIFIC ROUTES PEHLE — warna /:id inhe match kar leta hai

router.get('/search/query', searchProducts);
router.get('/search/autocomplete', searchAutocomplete);

router.post('/cart/add', protect, addToCart);
router.get('/cart/:userId', protect, getCart);
router.put('/cart/update', protect, updateCartQuantity);
router.delete('/cart/remove', protect, removeFromCart);
router.delete('/cart/clear', protect, clearCart);

// Product list
router.get('/', cacheMiddleware((req) => `products:${JSON.stringify(req.query)}`, 3600), fetchProduct);

// Admin
router.post('/add', protect, requireAdmin, upload.array('images'), createProduct);

// ⚠️ /:id SABSE LAST — ye hai asli fix
router.get('/single/:id', cacheMiddleware((req) => `product:${req.params.id}`, 3600), fetchSingleProduct);
router.put('/edit/:id', protect, requireAdmin, upload.array('images'), editProduct);
router.delete('/delete/:id', protect, requireAdmin, deleteProduct);

module.exports = router;