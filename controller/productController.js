// const fs = require('fs');
// const mongoose = require('mongoose');
// const Product = require('../model/productModel');
// const User = require('../model/newModel'); // Adjust the path based on your folder structure
// const Category = require('../model/categoryModels'); // Add Category model import
// const imagekit = require('../utilites/imagekit');
// const sharp = require('sharp'); // Add this dependency with: npm install sharp

// // Maximum allowed image resolution (in megapixels)
// const MAX_IMAGE_RESOLUTION_MP = 24; // Set slightly below 25MP limit

// // Helper to check and resize images if needed
// const processAndUploadImages = async (files) => {
//   console.log('🟡 Received files:', files);

//   return await Promise.all(
//     files.map(async (file) => {
//       try {
//         console.log('🟢 Processing file:', file.path);
        
//         // Get image metadata
//         const metadata = await sharp(file.path).metadata(); 
//         const megapixels = (metadata.width * metadata.height) / 1000000;
        
//         // Check if image exceeds size limit
//         if (megapixels > MAX_IMAGE_RESOLUTION_MP) {
//           console.log(`🟠 Image exceeds ${MAX_IMAGE_RESOLUTION_MP}MP limit (${megapixels.toFixed(2)}MP). Resizing...`);
          
//           // Calculate new dimensions to stay under limit while preserving aspect ratio
//           const aspectRatio = metadata.width / metadata.height;
//           const targetPixels = MAX_IMAGE_RESOLUTION_MP * 1000000;
          
//           let newWidth, newHeight;
          
//           if (aspectRatio >= 1) { // Landscape or square
//             newWidth = Math.sqrt(targetPixels * aspectRatio);
//             newHeight = newWidth / aspectRatio;
//           } else { // Portrait
//             newHeight = Math.sqrt(targetPixels / aspectRatio);
//             newWidth = newHeight * aspectRatio;
//           }
          
//           // Round dimensions to integers
//           newWidth = Math.floor(newWidth);
//           newHeight = Math.floor(newHeight);
          
//           console.log(`🟢 Resizing to ${newWidth}x${newHeight} (${((newWidth * newHeight)/1000000).toFixed(2)}MP)`);
          
//           // Create temp filename for resized image
//           const resizedFilePath = `${file.path}_resized`;
          
//           // Resize image and save to new temp file
//           await sharp(file.path)
//             .resize({ width: newWidth, height: newHeight, fit: 'inside' })
//             .toFile(resizedFilePath);
          
//           // Upload the resized image
//           const uploadResponse = await imagekit.upload({
//             file: fs.createReadStream(resizedFilePath),
//             fileName: `resized_${file.originalname}`,
//           });
          
//           // Clean up both files
//           fs.unlink(file.path, (err) => {
//             if (err) console.error('🔴 Original file deletion error:', err);
//           });
          
//           fs.unlink(resizedFilePath, (err) => {
//             if (err) console.error('🔴 Resized file deletion error:', err);
//           });
          
//           console.log('✅ Upload successful after resizing:', uploadResponse.url);
//           return { url: uploadResponse.url, fileName: uploadResponse.name };
//         } else {
//           // Upload original image if it's within limits
//           const uploadResponse = await imagekit.upload({
//             file: fs.createReadStream(file.path),
//             fileName: file.originalname,
//           });
          
//           // Delete the original file
//           fs.unlink(file.path, (err) => {
//             if (err) console.error('🔴 Temp file deletion error:', err);
//           });
          
//           console.log('✅ Upload successful:', uploadResponse.url);
//           return { url: uploadResponse.url, fileName: uploadResponse.name };
//         }
//       } catch (error) {
//         console.error('❌ Image processing/upload failed:', error);
        
//         // Try to clean up the file even if there was an error
//         try {
//           fs.unlinkSync(file.path);
//         } catch (unlinkError) {
//           console.error('🔴 Failed to delete temp file:', unlinkError);
//         }
        
//         throw new Error(`Image processing error: ${error.message}`);
//       }
//     })
//   );
// };

// // Helper to clean request body keys
// const cleanRequestBody = (body) => {
//   return Object.keys(body).reduce((acc, key) => {
//     acc[key.trim()] = body[key];
//     return acc;
//   }, {});
// };

// // Helper to validate and convert category to ObjectId
// const validateAndConvertCategory = async (categoryInput) => {
//   if (!categoryInput) {
//     throw new Error('Category is required');
//   }

//   let categoryId;
  
//   // If it's already an ObjectId, use it
//   if (mongoose.Types.ObjectId.isValid(categoryInput)) {
//     categoryId = categoryInput;
//   } else {
//     // If it's a string, try to find the category by name
//     const category = await Category.findOne({ 
//       name: { $regex: new RegExp(`^${categoryInput.trim()}$`, 'i') } 
//     });
    
//     if (!category) {
//       throw new Error(`Category "${categoryInput}" not found`);
//     }
    
//     categoryId = category._id;
//   }

//   // Verify the category exists
//   const categoryExists = await Category.findById(categoryId);
//   if (!categoryExists) {
//     throw new Error('Invalid category ID');
//   }

//   return categoryId;
// };

// // Create Product (Fixed with proper category handling)
// const createProduct = async (req, res) => {
//   try {
//     req.body = cleanRequestBody(req.body);

//     const { 
//       name, 
//       price, 
//       category, 
//       description, 
//       bestSeller = false
//     } = req.body;
    
//     console.log('🟡 Received product:', req.body);
    
//     // Only validate name and price - category is now optional
//     if (!name || !price) {
//       return res.status(400).json({ message: 'Please provide name and price' });
//     }

//     // Prepare product data
//     const productData = {
//       name,
//       price,
//       description,
//       bestSeller,
//     };

//     // Only add category if it's provided
//     if (category) {
//       try {
//         const categoryId = await validateAndConvertCategory(category);
//         productData.category = categoryId;
//       } catch (categoryError) {
//         console.error('❌ Category validation error:', categoryError);
//         return res.status(400).json({ 
//           success: false, 
//           message: categoryError.message 
//         });
//       }
//     }

//     // Upload images
//     const uploadedImages = req.files?.length ? await processAndUploadImages(req.files) : [];
//     console.log('🟢 Uploaded images:', uploadedImages);
    
//     productData.images = uploadedImages;

//     // Create product
//     const product = await Product.create(productData);

//     // Populate category if it exists
//     if (product.category) {
//       await product.populate('category', 'name');
//     }

//     res.status(201).json({
//       success: true,
//       data: product, 
//       message: 'Product created successfully',
//     });
//   } catch (e) {
//     console.error('🔴 Error creating product:', e);
//     res.status(500).json({ 
//       success: false, 
//       message: `Cannot add product: ${e.message}` 
//     });
//   }
// };

// // Also update editProduct function:
// const editProduct = async (req, res) => {
//   try {
//     req.body = cleanRequestBody(req.body);

//     const { id } = req.params;
//     const { name, price, description, category, bestSeller } = req.body;

//     const product = await Product.findById(id);
//     if (!product) return res.status(404).json({ message: 'Product not found' });

//     // Handle image updates
//     if (req.files?.length) { 
//       const newImages = await processAndUploadImages(req.files);
//       product.images = newImages;
//     }
 
//     // Update fields if provided
//     if (name) product.name = name;
//     if (price) product.price = price;
//     if (description) product.description = description;
//     if (bestSeller !== undefined) product.bestSeller = bestSeller;
    
//     // Handle category update - only if provided
//     if (category) {
//       try {
//         const categoryId = await validateAndConvertCategory(category);
//         product.category = categoryId;
//       } catch (categoryError) {
//         console.error('❌ Category validation error:', categoryError);
//         return res.status(400).json({ 
//           success: false, 
//           message: categoryError.message 
//         });
//       }
//     }

//     await product.save();

//     // Populate category if it exists
//     if (product.category) {
//       await product.populate('category', 'name');
//     }

//     res.status(200).json({
//       success: true,
//       data: product,
//       message: 'Product updated successfully',
//     });
//   } catch (e) {
//     console.error('🔴 Error updating product:', e);
//     res.status(500).json({ 
//       success: false, 
//       message: `Cannot update product: ${e.message}` 
//     });
//   }
// };









// // Fetch Products (Fixed with proper category filtering)
// // Enhanced fetchProduct with improved search capabilities
// const fetchProduct = async (req, res) => {
//   try {
//     const { 
//       category, 
//       search, 
//       minPrice, 
//       maxPrice, 
//       bestSeller,
//       sortBy = 'createdAt',
//       sortOrder = 'desc',
//       page = 1,
//       limit = 10
//     } = req.query;
    
//     let filter = {};

//     console.log('🔍 Search parameters:', { 
//       category, 
//       search, 
//       minPrice, 
//       maxPrice, 
//       bestSeller,
//       sortBy,
//       sortOrder 
//     });

//     // Category filter (your existing code)
//     if (category) {
//       let cleanCategory = category;
      
//       while (cleanCategory.includes('%')) {
//         try {
//           const decoded = decodeURIComponent(cleanCategory);
//           if (decoded === cleanCategory) break;
//           cleanCategory = decoded;
//         } catch (e) {
//           break;
//         }
//       }
      
//       cleanCategory = cleanCategory.trim();
//       console.log('🔍 Processed category:', `"${cleanCategory}"`);

//       try {
//         if (mongoose.Types.ObjectId.isValid(cleanCategory)) {
//           const categoryExists = await Category.findById(cleanCategory);
//           if (categoryExists) {
//             filter.category = cleanCategory;
//             console.log('✅ Found category by ObjectId:', cleanCategory);
//           }
//         } else {
//           const categoryDoc = await Category.findOne({ 
//             name: { $regex: new RegExp(`^${cleanCategory}$`, 'i') } 
//           });
          
//           if (categoryDoc) {
//             filter.category = categoryDoc._id;
//             console.log('✅ Found category by name:', categoryDoc.name, 'ID:', categoryDoc._id);
//           } else {
//             console.log('❌ No category found for:', cleanCategory);
            
//             const availableCategories = await Category.find({}, 'name');
            
//             return res.status(200).json({
//               success: true,
//               data: [],
//               message: `No products found in category "${cleanCategory}"`,
//               availableCategories: availableCategories.map(cat => cat.name)
//             });
//           }
//         }
//       } catch (categoryError) {
//         console.error('❌ Category lookup error:', categoryError);
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid category parameter'
//         });
//       }
//     }

//     // Enhanced search filter - searches in name and description
//     if (search) {
//       const cleanSearch = search.trim();
//       if (cleanSearch) {
//         // Create search conditions for multiple fields
//         const searchRegex = new RegExp(cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        
//         filter.$or = [
//           { name: searchRegex },
//           { description: searchRegex }
//         ];
//       }
//     }

//     // Price range filter
//     if (minPrice || maxPrice) {
//       filter.price = {};
//       if (minPrice) filter.price.$gte = parseFloat(minPrice);
//       if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
//     }

//     // Best seller filter
//     if (bestSeller !== undefined) {
//       filter.bestSeller = bestSeller === 'true';
//     }

//     console.log('🔍 Final filter:', JSON.stringify(filter, null, 2));

//     // Sorting options
//     const sortOptions = {};
//     switch (sortBy) {
//       case 'price':
//         sortOptions.price = sortOrder === 'asc' ? 1 : -1;
//         break;
//       case 'name':
//         sortOptions.name = sortOrder === 'asc' ? 1 : -1;
//         break;
//       case 'createdAt':
//       default:
//         sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
//         break;
//     }

//     // Calculate pagination
//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // Get total count for pagination
//     const totalCount = await Product.countDocuments(filter);

//     // Fetch products with pagination
//     const products = await Product.find(filter)
//       .populate('category', 'name')
//       .sort(sortOptions)
//       .skip(skip)
//       .limit(parseInt(limit));
    
//     console.log('✅ Products found:', products.length);

//     res.status(200).json({
//       success: true,
//       data: products,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(totalCount / parseInt(limit)),
//         totalProducts: totalCount,
//         hasNextPage: skip + products.length < totalCount,
//         hasPrevPage: parseInt(page) > 1
//       }
//     });

//   } catch (e) {
//     console.error('❌ Error in fetchProduct:', e);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Cannot fetch products',
//       error: e.message 
//     });
//   }
// };

// // Advanced search with text indexing (optional but powerful)
// const searchProducts = async (req, res) => {
//   try {
//     const { 
//       q, // search query
//       categories, // array of category IDs or names
//       priceRange, // e.g., "0-100" or "100-500"
//       inStock,
//       bestSeller,
//       sortBy = 'relevance',
//       page = 1,
//       limit = 10
//     } = req.query;

//     if (!q) {
//       return res.status(400).json({
//         success: false,
//         message: 'Search query (q) is required'
//       });
//     }

//     let filter = {};
    
//     // Text search across multiple fields
//     const searchRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
//     filter.$or = [
//       { name: searchRegex },
//       { description: searchRegex }
//     ];

//     // Multiple categories filter
//     if (categories) {
//       const categoryArray = Array.isArray(categories) ? categories : [categories];
//       const categoryIds = [];
      
//       for (const cat of categoryArray) {
//         if (mongoose.Types.ObjectId.isValid(cat)) {
//           categoryIds.push(cat);
//         } else {
//           const categoryDoc = await Category.findOne({ 
//             name: { $regex: new RegExp(`^${cat.trim()}$`, 'i') } 
//           });
//           if (categoryDoc) {
//             categoryIds.push(categoryDoc._id);
//           }
//         }
//       }
      
//       if (categoryIds.length > 0) {
//         filter.category = { $in: categoryIds };
//       }
//     }

//     // Price range filter
//     if (priceRange) {
//       const [min, max] = priceRange.split('-').map(p => parseFloat(p));
//       filter.price = {};
//       if (!isNaN(min)) filter.price.$gte = min;
//       if (!isNaN(max)) filter.price.$lte = max;
//     }

//     // Best seller filter
//     if (bestSeller !== undefined) {
//       filter.bestSeller = bestSeller === 'true';
//     }

//     // Sorting
//     let sortOptions = {};
//     switch (sortBy) {
//       case 'price_low':
//         sortOptions.price = 1;
//         break;
//       case 'price_high':
//         sortOptions.price = -1;
//         break;
//       case 'name':
//         sortOptions.name = 1;
//         break;
//       case 'newest':
//         sortOptions.createdAt = -1;
//         break;
//       case 'relevance':
//       default:
//         // For relevance, we'll sort by best match (this is simplified)
//         sortOptions = { score: { $meta: "textScore" } };
//         break;
//     }

//     const skip = (parseInt(page) - 1) * parseInt(limit);
//     const totalCount = await Product.countDocuments(filter);

//     const products = await Product.find(filter)
//       .populate('category', 'name')
//       .sort(sortOptions)
//       .skip(skip)
//       .limit(parseInt(limit));

//     // Get search suggestions based on results
//     const suggestions = await getSearchSuggestions(q, products);

//     res.status(200).json({
//       success: true,
//       query: q,
//       data: products,
//       suggestions,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(totalCount / parseInt(limit)),
//         totalProducts: totalCount,
//         hasNextPage: skip + products.length < totalCount,
//         hasPrevPage: parseInt(page) > 1
//       }
//     });

//   } catch (error) {
//     console.error('❌ Error in searchProducts:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Search failed',
//       error: error.message
//     });
//   }
// };

// // Autocomplete/suggestions endpoint
// const getSearchSuggestions = async (query, existingProducts = null) => {
//   try {
//     const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    
//     // If we already have products from a search, extract unique names
//     if (existingProducts) {
//       const names = [...new Set(existingProducts.map(p => p.name))];
//       return names.slice(0, 5);
//     }
    
//     // Otherwise, fetch suggestions from database
//     const products = await Product.find(
//       { name: searchRegex },
//       { name: 1 }
//     ).limit(10);
    
//     return [...new Set(products.map(p => p.name))];
//   } catch (error) {
//     console.error('Error getting suggestions:', error);
//     return [];
//   }
// };

// // Search autocomplete endpoint
// const searchAutocomplete = async (req, res) => {
//   try {
//     const { q } = req.query;
    
//     if (!q || q.length < 2) {
//       return res.status(200).json({
//         success: true,
//         suggestions: []
//       });
//     }

//     const suggestions = await getSearchSuggestions(q);
    
//     res.status(200).json({
//       success: true,
//       suggestions
//     });
    
//   } catch (error) {
//     console.error('❌ Error in autocomplete:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Autocomplete failed',
//       error: error.message
//     });
//   }
// };

// // Get single product by ID (bonus function)
// const getProductById = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid product ID'
//       });
//     }

//     const product = await Product.findById(id).populate('category', 'name');
    
//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: 'Product not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: product
//     });
//   } catch (error) {
//     console.error('❌ Error fetching product:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Cannot fetch product',
//       error: error.message
//     });
//   }
// };

// const addToCart = async (req, res) => {
//   try {
//     const { userId, productId, quantity } = req.body;

//     // Validate input
//     if (!userId || !productId) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'userId and productId are required' 
//       });
//     }

//     // Validate ObjectIds
//     if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid userId or productId'
//       });
//     }

//     // Check if models are properly imported
//     if (!User || !Product) {
//       console.error('❌ User or Product model not properly imported');
//       return res.status(500).json({ 
//         success: false, 
//         message: 'Server configuration error' 
//       });
//     }

//     // Find user
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     // Find product
//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Product not found' 
//       });
//     }

//     // Initialize cart if it doesn't exist
//     if (!user.cart) {
//       user.cart = [];
//     }

//     // Check if product already in cart
//     // const cartItem = user.cart.find((item) => item.product.toString() === productId);

//     // if (cartItem) {
//     //   // Update quantity
//     //   cartItem.quantity += quantity || 1;
//     // } else {
//     //   // Add new item - price comes from product when populated
//     //   user.cart.push({ 
//     //     product: productId, 
//     //     quantity: quantity || 1
//     //   });
//     // }

//     const cartItem = user.cart.find(
//   (item) => item.productId.toString() === productId
// );

// if (cartItem) {
//   cartItem.quantity += quantity || 1;
// } else {
//   user.cart.push({
//     productId: productId,
//     quantity: quantity || 1
//   });
// }


//     // Save user
//     await user.save();

//     // Try to return populated cart data
//     try {
//       const updatedUser = await User.findById(userId).populate({
//         path: 'cart.product',
//         select: 'name price images category description',
//         populate: {
//           path: 'category',
//           select: 'name'
//         }
//       });

//       res.status(200).json({ 
//         success: true,
//         message: 'Product added to cart successfully', 
//         cart: updatedUser.cart 
//       });
//     } catch (populateError) {
//       console.error('❌ Population error in addToCart:', populateError);
      
//       // If population fails, return cart without product details
//       res.status(200).json({ 
//         success: true,
//         message: 'Product added to cart successfully', 
//         cart: user.cart,
//         note: 'Product details will be loaded on next refresh'
//       });
//     }

//   } catch (error) {
//     console.error('❌ Error adding to cart:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Cannot add to cart',
//       error: error.message 
//     });
//   }
// };

// // Fixed getCart function with better error handling
// const getCart = async (req, res) => {
//   try {
//     const { userId } = req.params;
    
//     if (!userId) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'userId is required' 
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid userId'
//       });
//     }

//     // First, get user without population to check if cart exists
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     // If cart is empty, return empty array
//     if (!user.cart || user.cart.length === 0) {
//       return res.status(200).json({ 
//         success: true, 
//         cart: [] 
//       });
//     }

//     // Try to populate cart with product details
//     try {
//       const populatedUser = await User.findById(userId).populate({
//   path: 'cart.productId',
//   select: 'name price images description'
// });


//       res.status(200).json({ 
//         success: true, 
//         cart: populatedUser.cart 
//       });

//     } catch (populateError) {
//       console.error('❌ Population error:', populateError);
      
//       // If population fails, return cart without product details
//       res.status(200).json({ 
//         success: true, 
//         cart: user.cart,
//         message: 'Cart retrieved but product details could not be loaded'
//       });
//     }
    
//   } catch (error) {
//     console.error('❌ Error fetching cart:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Cannot fetch cart',
//       error: error.message 
//     });
//   }
// };

// // Updated other cart functions with better error handling
// const updateCartQuantity = async (req, res) => {
//   try {
//     const { userId, productId, quantity } = req.body;
    
//     if (!userId || !productId || quantity === undefined) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'userId, productId, and quantity are required' 
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid userId or productId'
//       });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }
    
//     const cartItem = user.cart.find((item) => item.productId.toString()
//  === productId);
    
//     if (cartItem) {
//       if (quantity <= 0) {
//         // Remove item if quantity is 0 or negative
//         user.cart = user.cart.filter((item) => item.productId.toString() !== productId);
//       } else {
//         cartItem.quantity = quantity;
//       }
      
//       await user.save();
      
//       res.status(200).json({ 
//         success: true, 
//         message: 'Cart updated successfully', 
//         cart: user.cart 
//       });
//     } else {
//       res.status(404).json({ 
//         success: false, 
//         message: 'Item not found in cart' 
//       });
//     }
//   } catch (error) {
//     console.error('❌ Error updating cart:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Cannot update cart',
//       error: error.message 
//     });
//   }
// };

// const removeFromCart = async (req, res) => {
//   try {
//     const { userId, productId } = req.body;
    
//     if (!userId || !productId) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'userId and productId are required' 
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid userId or productId'
//       });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }
    
//     const originalLength = user.cart.length;
//     user.cart = user.cart.filter((item) => item.productId.toString() !== productId);
    
//     if (user.cart.length === originalLength) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Item not found in cart' 
//       });
//     }

//     await user.save();
    
//     res.status(200).json({ 
//       success: true, 
//       message: 'Item removed from cart', 
//       cart: user.cart 
//     });
//   } catch (error) {
//     console.error('❌ Error removing from cart:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Cannot remove from cart',
//       error: error.message 
//     });
//   }
// };

// const clearCart = async (req, res) => {
//   try {
//     const { userId } = req.body;
    
//     if (!userId) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'userId is required' 
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid userId'
//       });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }
    
//     user.cart = [];
//     await user.save();
    
//     res.status(200).json({ 
//       success: true, 
//       message: 'Cart cleared successfully' 
//     });
//   } catch (error) {
//     console.error('❌ Error clearing cart:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Cannot clear cart',
//       error: error.message 
//     });
//   }
// };

// const deleteProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid product ID'
//       });
//     }
    
//     const product = await Product.findByIdAndDelete(id);

//     if (!product) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Product not found' 
//       });
//     }

//     res.status(200).json({ 
//       success: true,
//       message: 'Product deleted successfully' 
//     });
//   } catch (e) {
//     console.error('❌ Error deleting product:', e);
//     res.status(500).json({ 
//       success: false,
//       message: 'Cannot delete product',
//       error: e.message 
//     });
//   }
// };
// const fetchSingleProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     // Validate if ID is provided
//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: 'Product ID is required'
//       });
//     }

//     // Find product by ID (assuming you're using MongoDB/Mongoose)
//     const product = await Product.findById(id).populate('category');
    
//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: 'Product not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: product,
//       message: 'Product fetched successfully'
//     });
//   } catch (error) {
//     console.error('Error fetching single product:', error);
    
//     // Handle invalid ObjectId error
//     if (error.name === 'CastError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid product ID format'
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching product',
//       error: error.message
//     });
//   }
// };

// module.exports = { 
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
//   searchProducts, 
//    fetchSingleProduct,
//   searchAutocomplete 
// };





const fs = require('fs');
const mongoose = require('mongoose');
const Product = require('../model/productModel');
const User = require('../model/newModel');
const Category = require('../model/categoryModels');
const imagekit = require('../utilites/imagekit');
const sharp = require('sharp');
const { invalidateCache } = require('../middleware/cacheMiddleware');
const redis = require('../config/redisClient');

const MAX_IMAGE_RESOLUTION_MP = 24;
const SEARCH_CACHE_TTL = 600; // 10 minutes for search results

// ─── Image Processing ────────────────────────────────────────────────────────

const processAndUploadImages = async (files) => {
  console.log('🟡 Received files:', files);

  return await Promise.all(
    files.map(async (file) => {
      try {
        console.log('🟢 Processing file:', file.path);
        const metadata = await sharp(file.path).metadata();
        const megapixels = (metadata.width * metadata.height) / 1000000;

        if (megapixels > MAX_IMAGE_RESOLUTION_MP) {
          console.log(`🟠 Resizing image (${megapixels.toFixed(2)}MP)...`);
          const aspectRatio = metadata.width / metadata.height;
          const targetPixels = MAX_IMAGE_RESOLUTION_MP * 1000000;

          let newWidth, newHeight;
          if (aspectRatio >= 1) {
            newWidth = Math.floor(Math.sqrt(targetPixels * aspectRatio));
            newHeight = Math.floor(newWidth / aspectRatio);
          } else {
            newHeight = Math.floor(Math.sqrt(targetPixels / aspectRatio));
            newWidth = Math.floor(newHeight * aspectRatio);
          }

          const resizedFilePath = `${file.path}_resized`;
          await sharp(file.path)
            .resize({ width: newWidth, height: newHeight, fit: 'inside' })
            .toFile(resizedFilePath);

          const uploadResponse = await imagekit.upload({
            file: fs.createReadStream(resizedFilePath),
            fileName: `resized_${file.originalname}`,
          });

          fs.unlink(file.path, () => {});
          fs.unlink(resizedFilePath, () => {});

          return { url: uploadResponse.url, fileName: uploadResponse.name };
        } else {
          const uploadResponse = await imagekit.upload({
            file: fs.createReadStream(file.path),
            fileName: file.originalname,
          });
          fs.unlink(file.path, () => {});
          return { url: uploadResponse.url, fileName: uploadResponse.name };
        }
      } catch (error) {
        try { fs.unlinkSync(file.path); } catch (_) {}
        throw new Error(`Image processing error: ${error.message}`);
      }
    })
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const cleanRequestBody = (body) =>
  Object.keys(body).reduce((acc, key) => {
    acc[key.trim()] = body[key];
    return acc;
  }, {});

const validateAndConvertCategory = async (categoryInput) => {
  if (!categoryInput) throw new Error('Category is required');

  let categoryId;
  if (mongoose.Types.ObjectId.isValid(categoryInput)) {
    categoryId = categoryInput;
  } else {
    const category = await Category.findOne({
      name: { $regex: new RegExp(`^${categoryInput.trim()}$`, 'i') },
    });
    if (!category) throw new Error(`Category "${categoryInput}" not found`);
    categoryId = category._id;
  }

  const categoryExists = await Category.findById(categoryId);
  if (!categoryExists) throw new Error('Invalid category ID');
  return categoryId;
};

// ─── Create Product ───────────────────────────────────────────────────────────

const createProduct = async (req, res) => {
  try {
    req.body = cleanRequestBody(req.body);
    const { name, price, category, description, bestSeller = false } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Please provide name and price' });
    }

    const productData = { name, price, description, bestSeller };

    if (category) {
      try {
        productData.category = await validateAndConvertCategory(category);
      } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
    }

    const uploadedImages = req.files?.length ? await processAndUploadImages(req.files) : [];
    productData.images = uploadedImages;

    const product = await Product.create(productData);
    if (product.category) await product.populate('category', 'name');

    // Invalidate product list cache
    await invalidateCache('products');

    res.status(201).json({ success: true, data: product, message: 'Product created successfully' });
  } catch (e) {
    console.error('🔴 Error creating product:', e);
    res.status(500).json({ success: false, message: `Cannot add product: ${e.message}` });
  }
};

// ─── Edit Product ─────────────────────────────────────────────────────────────

const editProduct = async (req, res) => {
  try {
    req.body = cleanRequestBody(req.body);
    const { id } = req.params;
    const { name, price, description, category, bestSeller } = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.files?.length) {
      product.images = await processAndUploadImages(req.files);
    }

    if (name) product.name = name;
    if (price) product.price = price;
    if (description) product.description = description;
    if (bestSeller !== undefined) product.bestSeller = bestSeller;

    if (category) {
      try {
        product.category = await validateAndConvertCategory(category);
      } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
    }

    await product.save();
    if (product.category) await product.populate('category', 'name');

    // Invalidate related caches
    await invalidateCache('products', `product:${id}`);

    res.status(200).json({ success: true, data: product, message: 'Product updated successfully' });
  } catch (e) {
    console.error('🔴 Error updating product:', e);
    res.status(500).json({ success: false, message: `Cannot update product: ${e.message}` });
  }
};

// ─── Delete Product ───────────────────────────────────────────────────────────

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Invalidate related caches
    await invalidateCache('products', `product:${id}`);

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (e) {
    console.error('❌ Error deleting product:', e);
    res.status(500).json({ success: false, message: 'Cannot delete product', error: e.message });
  }
};

// ─── Fetch Products (with cache via route middleware) ─────────────────────────

const fetchProduct = async (req, res) => {
  try {
    const {
      category, search, minPrice, maxPrice, bestSeller,
      sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10,
    } = req.query;

    let filter = {};

    if (category) {
      let cleanCategory = category;
      while (cleanCategory.includes('%')) {
        try {
          const decoded = decodeURIComponent(cleanCategory);
          if (decoded === cleanCategory) break;
          cleanCategory = decoded;
        } catch (_) { break; }
      }
      cleanCategory = cleanCategory.trim();

      try {
        if (mongoose.Types.ObjectId.isValid(cleanCategory)) {
          const categoryExists = await Category.findById(cleanCategory);
          if (categoryExists) filter.category = cleanCategory;
        } else {
          const categoryDoc = await Category.findOne({
            name: { $regex: new RegExp(`^${cleanCategory}$`, 'i') },
          });
          if (categoryDoc) {
            filter.category = categoryDoc._id;
          } else {
            const availableCategories = await Category.find({}, 'name');
            return res.status(200).json({
              success: true, data: [],
              message: `No products found in category "${cleanCategory}"`,
              availableCategories: availableCategories.map((c) => c.name),
            });
          }
        }
      } catch (categoryError) {
        return res.status(400).json({ success: false, message: 'Invalid category parameter' });
      }
    }

    if (search) {
      const cleanSearch = search.trim();
      if (cleanSearch) {
        const searchRegex = new RegExp(cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ name: searchRegex }, { description: searchRegex }];
      }
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (bestSeller !== undefined) filter.bestSeller = bestSeller === 'true';

    const sortOptions = {};
    if (sortBy === 'price') sortOptions.price = sortOrder === 'asc' ? 1 : -1;
    else if (sortBy === 'name') sortOptions.name = sortOrder === 'asc' ? 1 : -1;
    else sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalCount = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalProducts: totalCount,
        hasNextPage: skip + products.length < totalCount,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (e) {
    console.error('❌ Error in fetchProduct:', e);
    res.status(500).json({ success: false, message: 'Cannot fetch products', error: e.message });
  }
};

// ─── Fetch Single Product (with cache via route middleware) ───────────────────

const fetchSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Product ID is required' });

    const product = await Product.findById(id).populate('category');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    res.status(200).json({ success: true, data: product, message: 'Product fetched successfully' });
  } catch (error) {
    console.error('Error fetching single product:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── Get Product By ID ────────────────────────────────────────────────────────

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    const product = await Product.findById(id).populate('category', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Cannot fetch product', error: error.message });
  }
};

// ─── Search with Redis caching ────────────────────────────────────────────────

const searchProducts = async (req, res) => {
  try {
    const {
      q, categories, priceRange, bestSeller,
      sortBy = 'relevance', page = 1, limit = 10,
    } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query (q) is required' });
    }

    // Build cache key from search params
    const cacheKey = `search:${JSON.stringify({ q, categories, priceRange, bestSeller, sortBy, page, limit })}`;

    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`✅ Search cache HIT: ${cacheKey}`);
      return res.status(200).json({ ...cached, fromCache: true });
    }

    let filter = {};
    const searchRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: searchRegex }, { description: searchRegex }];

    if (categories) {
      const categoryArray = Array.isArray(categories) ? categories : [categories];
      const categoryIds = [];
      for (const cat of categoryArray) {
        if (mongoose.Types.ObjectId.isValid(cat)) {
          categoryIds.push(cat);
        } else {
          const categoryDoc = await Category.findOne({
            name: { $regex: new RegExp(`^${cat.trim()}$`, 'i') },
          });
          if (categoryDoc) categoryIds.push(categoryDoc._id);
        }
      }
      if (categoryIds.length > 0) filter.category = { $in: categoryIds };
    }

    if (priceRange) {
      const [min, max] = priceRange.split('-').map(parseFloat);
      filter.price = {};
      if (!isNaN(min)) filter.price.$gte = min;
      if (!isNaN(max)) filter.price.$lte = max;
    }

    if (bestSeller !== undefined) filter.bestSeller = bestSeller === 'true';

    let sortOptions = {};
    switch (sortBy) {
      case 'price_low': sortOptions.price = 1; break;
      case 'price_high': sortOptions.price = -1; break;
      case 'name': sortOptions.name = 1; break;
      case 'newest': sortOptions.createdAt = -1; break;
      default: sortOptions.createdAt = -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalCount = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const suggestions = [...new Set(products.map((p) => p.name))].slice(0, 5);

    const responseBody = {
      success: true,
      query: q,
      data: products,
      suggestions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalProducts: totalCount,
        hasNextPage: skip + products.length < totalCount,
        hasPrevPage: parseInt(page) > 1,
      },
    };

    // Cache search result for 10 minutes
    await redis.set(cacheKey, responseBody, { ex: SEARCH_CACHE_TTL });
    console.log(`💾 Search cached: ${cacheKey}`);

    res.status(200).json(responseBody);
  } catch (error) {
    console.error('❌ Error in searchProducts:', error);
    res.status(500).json({ success: false, message: 'Search failed', error: error.message });
  }
};

// ─── Autocomplete ─────────────────────────────────────────────────────────────

const searchAutocomplete = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.status(200).json({ success: true, suggestions: [] });

    const cacheKey = `autocomplete:${q.toLowerCase()}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, suggestions: cached, fromCache: true });

    const searchRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const products = await Product.find({ name: searchRegex }, { name: 1 }).limit(10);
    const suggestions = [...new Set(products.map((p) => p.name))];

    await redis.set(cacheKey, suggestions, { ex: 300 }); // 5 min cache

    res.status(200).json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Autocomplete failed', error: error.message });
  }
};

// ─── Cart Functions ───────────────────────────────────────────────────────────

const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ success: false, message: 'userId and productId are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId or productId' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (!user.cart) user.cart = [];

    const cartItem = user.cart.find((item) => item.productId.toString() === productId);
    if (cartItem) {
      cartItem.quantity += quantity || 1;
    } else {
      user.cart.push({ productId, quantity: quantity || 1 });
    }

    await user.save();

    try {
      const updatedUser = await User.findById(userId).populate({
        path: 'cart.productId',
        select: 'name price images category description',
        populate: { path: 'category', select: 'name' },
      });
      res.status(200).json({ success: true, message: 'Product added to cart successfully', cart: updatedUser.cart });
    } catch (_) {
      res.status(200).json({ success: true, message: 'Product added to cart successfully', cart: user.cart });
    }
  } catch (error) {
    console.error('❌ Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Cannot add to cart', error: error.message });
  }
};

const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.cart || user.cart.length === 0) return res.status(200).json({ success: true, cart: [] });

    try {
      const populatedUser = await User.findById(userId).populate({
        path: 'cart.productId',
        select: 'name price images description',
      });
      res.status(200).json({ success: true, cart: populatedUser.cart });
    } catch (_) {
      res.status(200).json({ success: true, cart: user.cart, message: 'Cart retrieved but product details could not be loaded' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Cannot fetch cart', error: error.message });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'userId, productId, and quantity are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const cartItem = user.cart.find((item) => item.productId.toString() === productId);
    if (cartItem) {
      if (quantity <= 0) {
        user.cart = user.cart.filter((item) => item.productId.toString() !== productId);
      } else {
        cartItem.quantity = quantity;
      }
      await user.save();
      res.status(200).json({ success: true, message: 'Cart updated successfully', cart: user.cart });
    } else {
      res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Cannot update cart', error: error.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;
    if (!userId || !productId) {
      return res.status(400).json({ success: false, message: 'userId and productId are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const originalLength = user.cart.length;
    user.cart = user.cart.filter((item) => item.productId.toString() !== productId);

    if (user.cart.length === originalLength) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    await user.save();
    res.status(200).json({ success: true, message: 'Item removed from cart', cart: user.cart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Cannot remove from cart', error: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.cart = [];
    await user.save();
    res.status(200).json({ success: true, message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Cannot clear cart', error: error.message });
  }
};

module.exports = {
  createProduct,
  fetchProduct,
  editProduct,
  deleteProduct,
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getProductById,
  fetchSingleProduct,
  searchProducts,
  searchAutocomplete,
};