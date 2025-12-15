const express = require('express');
const { 
  createBlog, 
  fetchBlogs, 
  fetchSingleBlog,
  fetchBlogBySlug,
  editBlog, 
  deleteBlog 
} = require('../controller/blogController');
const upload = require('../middleware/multer');

const router = express.Router();

// Create blog - single image upload
router.post('/add', upload.single('image'), createBlog);

// Fetch all blogs with pagination and search
router.get('/fetch', fetchBlogs);

// Fetch single blog by ID
router.get('/single/:id', fetchSingleBlog);

// Fetch blog by slug (SEO friendly)
router.get('/slug/:slug', fetchBlogBySlug);

// Edit blog - single image upload
router.put('/edit/:id', upload.single('image'), editBlog);

// Delete blog
router.delete('/delete/:id', deleteBlog);

module.exports = router;