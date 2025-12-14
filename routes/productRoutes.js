const express = require('express');
const { 
  createProduct, 
  fetchProduct, 
  fetchSingleProduct, // Add this new function
  editProduct, 
  deleteProduct,
  addToCart, 
  getCart,   
  updateCartQuantity,   
  removeFromCart,   
  clearCart,
  searchProducts, // New advanced search   
  searchAutocomplete 
} = require('../controller/productController');
const upload = require('../middleware/multer');

const router = express.Router();

router.post('/add', upload.array('images', 5), createProduct);
router.get('/fetch', fetchProduct);
// Add this new route for fetching single product by ID
router.get('/single/:id', fetchSingleProduct);
router.put('/edit/:id', upload.array('images', 5), editProduct);
router.delete('/delete/:id', deleteProduct);
router.get('/autocomplete', searchAutocomplete);
router.post('/add-to-cart', addToCart);
router.get('/:userId', getCart);
router.put('/update', updateCartQuantity);
router.delete('/remove', removeFromCart);
router.delete('/clear', clearCart);

module.exports = router;