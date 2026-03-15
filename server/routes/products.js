const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { isAuthenticated, isAdmin, optionalAuth } = require('../middleware/auth');

/**
 * @route   GET /api/products
 * @desc    Get all products with optional filtering and pagination
 * @access  Public
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      search, 
      category_id, 
      min_price, 
      max_price, 
      material_type,
      condition,
      limit = 10, 
      offset = 0 
    } = req.query;
    
    let query = `
      SELECT p.*, c.name as category_name,
        (SELECT image_path FROM product_images WHERE product_id = p.product_id ORDER BY display_order LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.is_active = TRUE
    `;
    const params = [];
    
    // Search filter
    if (search) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Category filter
    if (category_id) {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }
    
    // Price filters
    if (min_price) {
      query += ` AND p.price >= ?`;
      params.push(min_price);
    }
    if (max_price) {
      query += ` AND p.price <= ?`;
      params.push(max_price);
    }
    
    // Material type filter
    if (material_type) {
      query += ` AND p.material_type = ?`;
      params.push(material_type);
    }
    
    // Condition filter
    if (condition) {
      query += ` AND p.condition = ?`;
      params.push(condition);
    }
    
    // Get total count
    const [countResult] = await pool.query(
      query.replace('SELECT p.*, c.name as category_name,\n        (SELECT image_path FROM product_images WHERE product_id = p.product_id ORDER BY display_order LIMIT 1) as primary_image', 'SELECT COUNT(*) as total'),
      params
    );
    const total = countResult[0].total;
    
    // Add pagination
    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const [products] = await pool.query(query, params);
    
    res.status(200).json({
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error fetching products.' });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [products] = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.product_id = ?
    `, [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    
    // Get product images
    const [images] = await pool.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order',
      [id]
    );
    
    const product = {
      ...products[0],
      images
    };
    
    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Server error fetching product.' });
  }
});

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Admin only
 */
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      category_id, 
      stock_quantity,
      sku,
      weight_kg,
      dimensions_cm,
      material_type,
      condition
    } = req.body;
    
    // Validation
    if (!name || !price || !category_id || stock_quantity === undefined || !sku || !material_type || !condition) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, price, category_id, stock_quantity, sku, material_type, condition' 
      });
    }
    
    // Check if SKU already exists
    const [existingSku] = await pool.query(
      'SELECT product_id FROM products WHERE sku = ?',
      [sku]
    );
    
    if (existingSku.length > 0) {
      return res.status(409).json({ error: 'SKU already exists.' });
    }
    
    // Insert product
    const [result] = await pool.query(
      `INSERT INTO products 
       (name, description, price, category_id, stock_quantity, sku, weight_kg, dimensions_cm, material_type, condition)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, price, category_id, stock_quantity, sku, weight_kg, dimensions_cm, material_type, condition]
    );
    
    res.status(201).json({
      message: 'Product created successfully',
      product: {
        id: result.insertId,
        name,
        price,
        category_id,
        stock_quantity
      }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Server error creating product.' });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Admin only
 */
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      price, 
      category_id, 
      stock_quantity,
      sku,
      weight_kg,
      dimensions_cm,
      material_type,
      condition,
      is_active
    } = req.body;
    
    // Check if product exists
    const [existing] = await pool.query(
      'SELECT product_id FROM products WHERE product_id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    
    // Build update query dynamically
    const updates = [];
    const params = [];
    
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (price !== undefined) { updates.push('price = ?'); params.push(price); }
    if (category_id !== undefined) { updates.push('category_id = ?'); params.push(category_id); }
    if (stock_quantity !== undefined) { updates.push('stock_quantity = ?'); params.push(stock_quantity); }
    if (sku !== undefined) { updates.push('sku = ?'); params.push(sku); }
    if (weight_kg !== undefined) { updates.push('weight_kg = ?'); params.push(weight_kg); }
    if (dimensions_cm !== undefined) { updates.push('dimensions_cm = ?'); params.push(dimensions_cm); }
    if (material_type !== undefined) { updates.push('material_type = ?'); params.push(material_type); }
    if (condition !== undefined) { updates.push('`condition` = ?'); params.push(condition); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }
    
    params.push(id);
    
    await pool.query(
      `UPDATE products SET ${updates.join(', ')} WHERE product_id = ?`,
      params
    );
    
    res.status(200).json({
      message: 'Product updated successfully',
      productId: id
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Server error updating product.' });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product (soft delete by setting is_active = false)
 * @access  Admin only
 */
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query(
      'UPDATE products SET is_active = FALSE WHERE product_id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    
    res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Server error deleting product.' });
  }
});

/**
 * @route   POST /api/products/:id/images
 * @desc    Upload product images
 * @access  Admin only
 */
router.post('/:id/images', isAuthenticated, isAdmin, async (req, res) => {
  // Note: Multer setup will be needed for file uploads
  // For now, this is a placeholder that accepts image URLs
  try {
    const { id } = req.params;
    const { images } = req.body; // Array of { path, alt_text }
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images provided.' });
    }
    
    // Check if product exists
    const [existing] = await pool.query(
      'SELECT product_id FROM products WHERE product_id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    
    // Insert images
    const imageValues = images.map((img, index) => [
      id, 
      img.path, 
      img.alt_text || '', 
      index
    ]);
    
    await pool.query(
      `INSERT INTO product_images (product_id, image_path, alt_text, display_order) VALUES ?`,
      [imageValues]
    );
    
    res.status(200).json({
      message: 'Images uploaded successfully',
      productId: id,
      count: images.length
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Server error uploading images.' });
  }
});

module.exports = router;
