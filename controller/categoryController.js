const Category = require('../model/categoryModels');
const Product = require('../model/productModel');

// Helper to clean request body keys
const cleanRequestBody = (body) => {
  return Object.keys(body).reduce((acc, key) => {
    acc[key.trim()] = body[key];
    return acc;
  }, {});
};

// Create Category
const createCategory = async (req, res) => {
  try {
    req.body = cleanRequestBody(req.body);
    
    const { name, description, isActive = true } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false,
        message: 'Category name is required' 
      });
    }

    // Check if category already exists (case-insensitive)
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(409).json({ 
        success: false,
        message: 'Category already exists' 
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description?.trim(),
      isActive
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
    
  } catch (error) {
    console.error('❌ Error creating category:', error);
    res.status(500).json({ 
      success: false, 
      message: `Cannot create category: ${error.message}` 
    });
  }
};

// Get All Categories
const getAllCategories = async (req, res) => {
  try {
    const { isActive, includeProductCount } = req.query;
    
    // Build filter
    let filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    let categories;
    
    if (includeProductCount === 'true') {
      // Get categories with product count using aggregation
      categories = await Category.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'products', // Make sure this matches your products collection name
            localField: 'name',
            foreignField: 'category',
            as: 'products'
          }
        },
        {
          $addFields: {
            productCount: { $size: '$products' }
          }
        },
        {
          $project: {
            name: 1,
            description: 1,
            isActive: 1,
            createdAt: 1,
            updatedAt: 1,
            productCount: 1
          }
        },
        { $sort: { createdAt: -1 } }
      ]);
    } else {
      // Simple category fetch
      categories = await Category.find(filter).sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      data: categories,
      total: categories.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Cannot fetch categories',
      error: error.message 
    });
  }
};

// Get Single Category
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: 'Category not found' 
      });
    }

    // Get product count for this category
    const productCount = await Product.countDocuments({ category: category.name });

    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        productCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Cannot fetch category',
      error: error.message 
    });
  }
};

// Update Category
const updateCategory = async (req, res) => {
  try {
    req.body = cleanRequestBody(req.body);
    
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: 'Category not found' 
      });
    }

    // If name is being updated, check for duplicates and update products
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingCategory) {
        return res.status(409).json({ 
          success: false,
          message: 'Category name already exists' 
        });
      }

      // Update all products that use this category
      const oldCategoryName = category.name;
      const newCategoryName = name.trim();
      
      await Product.updateMany(
        { category: oldCategoryName },
        { category: newCategoryName }
      );
      
      console.log(`✅ Updated products from category "${oldCategoryName}" to "${newCategoryName}"`);
      
      category.name = newCategoryName;
    }

    // Update other fields
    if (description !== undefined) category.description = description?.trim();
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.status(200).json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating category:', error);
    res.status(500).json({ 
      success: false, 
      message: `Cannot update category: ${error.message}` 
    });
  }
};

// Delete Category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { reassignTo } = req.body; // Optional: ID of category to reassign products to
    
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: 'Category not found' 
      });
    }

    // Check if there are products using this category
    const productCount = await Product.countDocuments({ category: category.name });
    
    if (productCount > 0) {
      if (reassignTo) {
        // Reassign products to another category
        const newCategory = await Category.findById(reassignTo);
        
        if (!newCategory) {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid reassign category ID' 
          });
        }

        await Product.updateMany(
          { category: category.name },
          { category: newCategory.name }
        );
        
        console.log(`✅ Reassigned ${productCount} products to category "${newCategory.name}"`);
      } else {
        // Don't allow deletion if products exist and no reassignment specified
        return res.status(400).json({ 
          success: false,
          message: `Cannot delete category. ${productCount} products are using this category. Please reassign products first or provide a reassignTo category ID.`,
          productCount
        });
      }
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      productsReassigned: productCount > 0 && reassignTo ? productCount : 0
    });
    
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    res.status(500).json({ 
      success: false, 
      message: `Cannot delete category: ${error.message}` 
    });
  }
};

// Toggle Category Status (Active/Inactive)
const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: 'Category not found' 
      });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.status(200).json({
      success: true,
      data: category,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`
    });
    
  } catch (error) {
    console.error('❌ Error toggling category status:', error);
    res.status(500).json({ 
      success: false, 
      message: `Cannot toggle category status: ${error.message}` 
    });
  }
};

// Get Active Categories Only (for dropdowns, etc.)
const getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name description')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: categories
    });
    
  } catch (error) {
    console.error('❌ Error fetching active categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Cannot fetch active categories',
      error: error.message 
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getActiveCategories
};