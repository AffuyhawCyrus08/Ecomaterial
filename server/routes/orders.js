const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

/**
 * @route   POST /api/orders
 * @desc    Create a new order from cart
 * @access  Private
 */
router.post('/', isAuthenticated, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.session.user.id;
    const { shipping_address_id, billing_address_id, payment_method } = req.body;
    
    // Get cart
    const [carts] = await connection.query(
      'SELECT cart_id FROM carts WHERE user_id = ?',
      [userId]
    );
    
    if (carts.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cart is empty.' });
    }
    
    // Get cart items
    const [cartItems] = await connection.query(`
      SELECT ci.product_id, ci.quantity, p.price, p.stock_quantity, p.name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.cart_id = ?
    `, [carts[0].cart_id]);
    
    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cart is empty.' });
    }
    
    // Verify stock
    for (const item of cartItems) {
      if (item.stock_quantity < item.quantity) {
        await connection.rollback();
        return res.status(400).json({ 
          error: `Insufficient stock for ${item.name}. Available: ${item.stock_quantity}` 
        });
      }
    }
    
    // Calculate total
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Get addresses if not provided
    let shippingAddr = shipping_address_id;
    let billingAddr = billing_address_id;
    
    if (!shippingAddr || !billingAddr) {
      const [addresses] = await connection.query(
        'SELECT address_id, is_default_shipping, is_default_billing FROM addresses WHERE user_id = ?',
        [userId]
      );
      
      if (!shippingAddr) {
        const defaultShipping = addresses.find(a => a.is_default_shipping);
        if (!defaultShipping) {
          await connection.rollback();
          return res.status(400).json({ error: 'Shipping address required.' });
        }
        shippingAddr = defaultShipping.address_id;
      }
      
      if (!billingAddr) {
        const defaultBilling = addresses.find(a => a.is_default_billing);
        if (!defaultBilling) {
          await connection.rollback();
          return res.status(400).json({ error: 'Billing address required.' });
        }
        billingAddr = defaultBilling.address_id;
      }
    }
    
    // Create order
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, payment_method)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, totalAmount, shippingAddr, billingAddr, payment_method || 'Credit Card']
    );
    
    const orderId = orderResult.insertId;
    
    // Create order items and update stock
    for (const item of cartItems) {
      const subtotal = item.price * item.quantity;
      
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price, subtotal]
      );
      
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
        [item.quantity, item.product_id]
      );
    }
    
    // Clear cart
    await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [carts[0].cart_id]);
    
    await connection.commit();
    
    res.status(201).json({
      message: 'Order placed successfully',
      orderId,
      totalAmount
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Server error creating order.' });
  } finally {
    connection.release();
  }
});

/**
 * @route   GET /api/orders/me
 * @desc    Get current user's orders
 * @access  Private
 */
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    const [orders] = await pool.query(`
      SELECT o.*, 
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as item_count
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.order_date DESC
    `, [userId]);
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Server error fetching orders.' });
  }
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get order details by ID
 * @access  Private (Owner or Admin)
 */
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;
    const isAdmin = req.session.user.role === 'admin';
    
    const [orders] = await pool.query(`
      SELECT o.*, 
        sa.address_line1 as shipping_address_line1,
        sa.address_line2 as shipping_address_line2,
        sa.city as shipping_city,
        sa.postal_code as shipping_postal_code,
        sa.country as shipping_country,
        ba.address_line1 as billing_address_line1,
        ba.city as billing_city
      FROM orders o
      LEFT JOIN addresses sa ON o.shipping_address_id = sa.address_id
      LEFT JOIN addresses ba ON o.billing_address_id = ba.address_id
      WHERE o.order_id = ?
    `, [id]);
    
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    
    const order = orders[0];
    
    // Check authorization
    if (!isAdmin && order.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this order.' });
    }
    
    // Get order items
    const [items] = await pool.query(`
      SELECT oi.*, p.name, p.description,
        (SELECT image_path FROM product_images WHERE product_id = p.product_id ORDER BY display_order LIMIT 1) as primary_image
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, [id]);
    
    res.status(200).json({
      ...order,
      items
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Server error fetching order.' });
  }
});

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders (Admin)
 * @access  Admin only
 */
router.get('/admin/all', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT o.*, u.email, u.first_name, u.last_name,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
    `;
    const params = [];
    
    if (status) {
      query += ' WHERE o.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY o.order_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [orders] = await pool.query(query, params);
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Server error fetching orders.' });
  }
});

/**
 * @route   PUT /api/admin/orders/:id/status
 * @desc    Update order status (Admin)
 * @access  Admin only
 */
router.put('/:id/status', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_number } = req.body;
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Valid values: ${validStatuses.join(', ')}` 
      });
    }
    
    let query = 'UPDATE orders SET status = ?';
    const params = [status];
    
    if (tracking_number) {
      query += ', tracking_number = ?';
      params.push(tracking_number);
    }
    
    query += ' WHERE order_id = ?';
    params.push(id);
    
    const [result] = await pool.query(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    
    res.status(200).json({ message: 'Order status updated successfully.' });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Server error updating order.' });
  }
});

module.exports = router;
