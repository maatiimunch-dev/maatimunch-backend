// const express = require('express');
// const { 
//   createBlog, 
//   fetchBlogs, 
//   fetchSingleBlog,
//   fetchBlogBySlug,
//   editBlog, 
//   deleteBlog 
// } = require('../controller/blogController');
// const upload = require('../middleware/multer');

// const router = express.Router();

// // Create blog - single image upload
// router.post('/add', upload.single('image'), createBlog);

// // Fetch all blogs with pagination and search
// router.get('/fetch', fetchBlogs);

// // Fetch single blog by ID
// router.get('/single/:id', fetchSingleBlog);

// // Fetch blog by slug (SEO friendly)
// router.get('/slug/:slug', fetchBlogBySlug);

// // Edit blog - single image upload
// router.put('/edit/:id', upload.single('image'), editBlog);

// // Delete blog
// router.delete('/delete/:id', deleteBlog);

// module.exports = router;




const express = require('express');
const router = express.Router();

const {
  createBlog,
  fetchBlogs,
  fetchSingleBlog,
  fetchBlogBySlug,
  editBlog,
  deleteBlog,
} = require('../controller/blogController');

const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const upload = require('../middleware/multer');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

// ─── Public Routes ────────────────────────────────────────────────────────────

router.get('/', cacheMiddleware((req) => `blogs:${JSON.stringify(req.query)}`, 3600), fetchBlogs);
router.get('/slug/:slug', fetchBlogBySlug);
router.get('/:id', cacheMiddleware((req) => `blog:${req.params.id}`, 3600), fetchSingleBlog);

// ─── Admin Routes ─────────────────────────────────────────────────────────────

router.post('/', protect, requireAdmin, upload.single('image'), createBlog);
router.put('/:id', protect, requireAdmin, upload.single('image'), editBlog);
router.delete('/:id', protect, requireAdmin, deleteBlog);

module.exports = router;