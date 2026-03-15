const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @route   GET /api/cart
 * @desc    Get user's shopping cart
 * @access  Private
 */
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Get or create cart
    let [carts] = await pool.query(
      'SELECT cart_id FROM carts WHERE user_id = ?',
      [userId]
    );
    
    let cartId;
    if (carts.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO carts (user_id) VALUES (?)',
        [userId]
      );
      cartId = result.insertId;
    } else {
      cartId = carts[0].cart_id;
    }
    
    // Get cart items with product details
    const [items] = await pool.query(`
      SELECT 
        ci.cart_item_id,
        ci.quantity,
        ci.added_at,
        p.product_id,
        p.name,
        p.description,
        p.price,
        p.stock_quantity,
        p.material_type,
        p.condition,
        (SELECT image_path FROM product_images WHERE product_id = p.product_id ORDER BY display_order LIMIT 1) as primary_image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.cart_id = ?
    `, [cartId]);
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    res.status(200).json({
      cartId,
      items,
      subtotal,
      itemCount: items.length
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Server error fetching cart.' });
  }
});

/**
 * @route   POST /api/cart/items
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/items', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required.' });
    }
    
    // Check if product exists and has stock
    const [products] = await pool.query(
      'SELECT product_id, stock_quantity, is_active FROM products WHERE product_id = ?',
      [productId]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    
    if (!products[0].is_active) {
      return res.status(400).json({ error: 'Product is not available.' });
    }
    
    if (products[0].stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock.' });
    }
    
    // Get or create cart
    let [carts] = await pool.query(
      'SELECT cart_id FROM carts WHERE user_id = ?',
      [userId]
    );
    
    let cartId;
    if (carts.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO carts (user_id) VALUES (?)',
        [userId]
      );
      cartId = result.insertId;
    } else {
      cartId = carts[0].cart_id;
    }
    
    // Check if item already in cart
    const [existingItems] = await pool.query(
      'SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, productId]
    );
    
    if (existingItems.length > 0) {
      // Update quantity
      const newQuantity = existingItems[0].quantity + quantity;
      
      if (products[0].stock_quantity < newQuantity) {
        return res.status(400).json({ error: 'Insufficient stock for requested quantity.' });
      }
      
      await pool.query(
        'UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?',
        [newQuantity, existingItems[0].cart_item_id]
      );
    } else {
      // Add new item
      await pool.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
        [cartId, productId, quantity]
      );
    }
    
    res.status(200).json({ 
      message: 'Item added to cart',
      productId,
      quantity
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Server error adding to cart.' });
  }
});

/**
 * @route   PUT /api/cart/items/:itemId
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put('/items/:itemId', isAuthenticated, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Valid quantity is required.' });
    }
    
    // Get cart item with product info
    const [items] = await pool.query(`
      SELECT ci.*, c.user_id, p.stock_quantity
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.cart_id
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.cart_item_id = ?
    `, [itemId]);
    
    if (items.length === 0) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }
    
    if (items[0].user_id !== req.session.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    
    if (items[0].stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock.' });
    }
    
    await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?',
      [quantity, itemId]
    );
    
    res.status(200).json({ message: 'Cart updated successfully.' });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'Server error updating cart.' });
  }
});

/**
 * @route   DELETE /api/cart/items/:itemId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/items/:itemId', isAuthenticated, async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Verify ownership
    const [items] = await pool.query(`
      SELECT ci.cart_item_id
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.cart_id
      WHERE ci.cart_item_id = ? AND c.user_id = ?
    `, [itemId, req.session.user.id]);
    
    if (items.length === 0) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }
    
    await pool.query('DELETE FROM cart_items WHERE cart_item_id = ?', [itemId]);
    
    res.status(200).json({ message: 'Item removed from cart.' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Server error removing from cart.' });
  }
});

/**
 * @route   DELETE /api/cart
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    const [carts] = await pool.query(
      'SELECT cart_id FROM carts WHERE user_id = ?',
      [userId]
    );
    
    if (carts.length > 0) {
      await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [carts[0].cart_id]);
    }
    
    res.status(200).json({ message: 'Cart cleared successfully.' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Server error clearing cart.' });
  }
});

module.exports = router;
