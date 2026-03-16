// const express = require('express');
// const router = express.Router();
// const {
//   createCategory,
//   getAllCategories,
//   getCategoryById,
//   updateCategory,
//   deleteCategory,
//   toggleCategoryStatus,
//   getActiveCategories
// } = require('../controller/categoryController');

// // Routes for category management

// // GET /api/categories - Get all categories (with optional filters)
// // Query params: isActive=true/false, includeProductCount=true/false
// router.get('/', getAllCategories);

// // GET /api/categories/active - Get only active categories (for dropdowns)
// router.get('/active', getActiveCategories);

// // GET /api/categories/:id - Get single category by ID
// router.get('/:id', getCategoryById);

// // POST /api/categories - Create new category
// router.post('/', createCategory);

// // PUT /api/categories/:id - Update category
// router.put('/:id', updateCategory);

// // PATCH /api/categories/:id/toggle - Toggle category active status
// router.patch('/:id/toggle', toggleCategoryStatus);

// // DELETE /api/categories/:id - Delete category
// // Body: { reassignTo: "categoryId" } - optional, to reassign products
// router.delete('/:id', deleteCategory);

// module.exports = router;



const express = require('express');
const router = express.Router();

const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getActiveCategories,
} = require('../controller/categoryController');

const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

// ─── Public Routes ────────────────────────────────────────────────────────────

router.get('/', cacheMiddleware('categories', 3600), getAllCategories);
router.get('/active', cacheMiddleware('categories:active', 3600), getActiveCategories);
router.get('/:id', getCategoryById);

// ─── Admin Routes ─────────────────────────────────────────────────────────────

router.post('/', protect, requireAdmin, createCategory);
router.put('/:id', protect, requireAdmin, updateCategory);
router.delete('/:id', protect, requireAdmin, deleteCategory);
router.patch('/:id/toggle', protect, requireAdmin, toggleCategoryStatus);

module.exports = router;