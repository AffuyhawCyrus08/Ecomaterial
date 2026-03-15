const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT c.*, 
        (SELECT name FROM categories WHERE category_id = c.parent_category_id) as parent_name,
        (SELECT COUNT(*) FROM products WHERE category_id = c.category_id AND is_active = TRUE) as product_count
      FROM categories c
      ORDER BY c.name
    `);
    
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Server error fetching categories.' });
  }
});

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE category_id = ?',
      [id]
    );
    
    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    
    res.status(200).json(categories[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Server error fetching category.' });
  }
});

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Admin only
 */
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, description, parent_category_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }
    
    // Check if name already exists
    const [existing] = await pool.query(
      'SELECT category_id FROM categories WHERE name = ?',
      [name]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Category name already exists.' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO categories (name, description, parent_category_id) VALUES (?, ?, ?)',
      [name, description, parent_category_id || null]
    );
    
    res.status(201).json({
      message: 'Category created successfully',
      categoryId: result.insertId,
      name
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Server error creating category.' });
  }
});

/**
 * @route   PUT /api/categories/:id
 * @desc    Update a category
 * @access  Admin only
 */
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent_category_id } = req.body;
    
    const [result] = await pool.query(
      'UPDATE categories SET name = ?, description = ?, parent_category_id = ? WHERE category_id = ?',
      [name, description, parent_category_id || null, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    
    res.status(200).json({ message: 'Category updated successfully.' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Server error updating category.' });
  }
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category
 * @access  Admin only
 */
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category has products
    const [products] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );
    
    if (products[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with existing products. Move or delete products first.' 
      });
    }
    
    const [result] = await pool.query(
      'DELETE FROM categories WHERE category_id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    
    res.status(200).json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Server error deleting category.' });
  }
});

module.exports = router;
