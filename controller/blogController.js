const fs = require('fs');
const mongoose = require('mongoose');
const Blog = require('../model/blogModel');
const imagekit = require('../utilites/imagekit');
const sharp = require('sharp');

// Maximum allowed image resolution (in megapixels)
const MAX_IMAGE_RESOLUTION_MP = 24;

// Helper to process and upload image
const processAndUploadImage = async (file) => {
  try {
    console.log('🟢 Processing blog image:', file.path);
    
    // Get image metadata
    const metadata = await sharp(file.path).metadata();
    const megapixels = (metadata.width * metadata.height) / 1000000;
    
    // Check if image exceeds size limit
    if (megapixels > MAX_IMAGE_RESOLUTION_MP) {
      console.log(`🟠 Image exceeds ${MAX_IMAGE_RESOLUTION_MP}MP limit (${megapixels.toFixed(2)}MP). Resizing...`);
      
      // Calculate new dimensions
      const aspectRatio = metadata.width / metadata.height;
      const targetPixels = MAX_IMAGE_RESOLUTION_MP * 1000000;
      
      let newWidth, newHeight;
      
      if (aspectRatio >= 1) {
        newWidth = Math.sqrt(targetPixels * aspectRatio);
        newHeight = newWidth / aspectRatio;
      } else {
        newHeight = Math.sqrt(targetPixels / aspectRatio);
        newWidth = newHeight * aspectRatio;
      }
      
      newWidth = Math.floor(newWidth);
      newHeight = Math.floor(newHeight);
      
      console.log(`🟢 Resizing to ${newWidth}x${newHeight}`);
      
      const resizedFilePath = `${file.path}_resized`;
      
      // Resize image
      await sharp(file.path)
        .resize({ width: newWidth, height: newHeight, fit: 'inside' })
        .toFile(resizedFilePath);
      
      // Upload resized image
      const uploadResponse = await imagekit.upload({
        file: fs.createReadStream(resizedFilePath),
        fileName: `blog_resized_${file.originalname}`,
        folder: '/blogs'
      });
      
      // Clean up files
      fs.unlink(file.path, (err) => {
        if (err) console.error('🔴 Original file deletion error:', err);
      });
      
      fs.unlink(resizedFilePath, (err) => {
        if (err) console.error('🔴 Resized file deletion error:', err);
      });
      
      console.log('✅ Upload successful after resizing:', uploadResponse.url);
      return { url: uploadResponse.url, fileName: uploadResponse.name };
    } else {
      // Upload original image
      const uploadResponse = await imagekit.upload({
        file: fs.createReadStream(file.path),
        fileName: file.originalname,
        folder: '/blogs'
      });
      
      // Delete temp file
      fs.unlink(file.path, (err) => {
        if (err) console.error('🔴 Temp file deletion error:', err);
      });
      
      console.log('✅ Upload successful:', uploadResponse.url);
      return { url: uploadResponse.url, fileName: uploadResponse.name };
    }
  } catch (error) {
    console.error('❌ Image processing/upload failed:', error);
    
    // Clean up file on error
    try {
      fs.unlinkSync(file.path);
    } catch (unlinkError) {
      console.error('🔴 Failed to delete temp file:', unlinkError);
    }
    
    throw new Error(`Image processing error: ${error.message}`);
  }
};

// Create Blog
const createBlog = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    console.log('🟡 Received blog data:', req.body);
    
    // Validation
    if (!title || !description) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide title and description' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Please upload an image' 
      });
    }

    // Upload image
    const uploadedImage = await processAndUploadImage(req.file);
    console.log('🟢 Uploaded image:', uploadedImage);

    // Create blog
    const blog = await Blog.create({
      title,
      description,
      image: uploadedImage,
    });

    res.status(201).json({
      success: true,
      data: blog,
      message: 'Blog created successfully',
    });
  } catch (error) {
    console.error('🔴 Error creating blog:', error);
    res.status(500).json({
      success: false,
      message: `Cannot create blog: ${error.message}`,
    });
  }
};

// Fetch All Blogs
const fetchBlogs = async (req, res) => {
  try {
    const { 
      search, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;
    
    let filter = {};

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalCount = await Blog.countDocuments(filter);

    // Fetch blogs
    const blogs = await Blog.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    console.log('✅ Blogs found:', blogs.length);

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalBlogs: totalCount,
        hasNextPage: skip + blogs.length < totalCount,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('❌ Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Cannot fetch blogs',
      error: error.message
    });
  }
};

// Fetch Single Blog by ID
const fetchSingleBlog = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Blog ID is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID format'
      });
    }

    const blog = await Blog.findById(id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      success: true,
      data: blog,
      message: 'Blog fetched successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching blog:', error);
    res.status(500).json({
      success: false,
      message: 'Cannot fetch blog',
      error: error.message
    });
  }
};

// Fetch Blog by Slug
const fetchBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Blog slug is required'
      });
    }

    const blog = await Blog.findOne({ slug: slug.toLowerCase() });
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      success: true,
      data: blog,
      message: 'Blog fetched successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching blog by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Cannot fetch blog',
      error: error.message
    });
  }
};

// Edit Blog
const editBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID'
      });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ 
        success: false,
        message: 'Blog not found' 
      });
    }

    // Update image if new one is uploaded
    if (req.file) {
      const newImage = await processAndUploadImage(req.file);
      blog.image = newImage;
    }

    // Update fields
    if (title) blog.title = title;
    if (description) blog.description = description;

    await blog.save();

    res.status(200).json({
      success: true,
      data: blog,
      message: 'Blog updated successfully',
    });
  } catch (error) {
    console.error('🔴 Error updating blog:', error);
    res.status(500).json({
      success: false,
      message: `Cannot update blog: ${error.message}`,
    });
  }
};

// Delete Blog
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID'
      });
    }
    
    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting blog:', error);
    res.status(500).json({
      success: false,
      message: 'Cannot delete blog',
      error: error.message
    });
  }
};

module.exports = {
  createBlog,
  fetchBlogs,
  fetchSingleBlog,
  fetchBlogBySlug,
  editBlog,
  deleteBlog,
};