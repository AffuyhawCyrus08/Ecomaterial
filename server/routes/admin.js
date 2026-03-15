const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Admin only
 */
router.get('/stats', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get total sales
    const [salesResult] = await pool.query(
      'SELECT COALESCE(SUM(total_amount), 0) as total_sales FROM orders WHERE status != "cancelled"'
    );
    
    // Get new leads (new users this month)
    const [leadsResult] = await pool.query(`
      SELECT COUNT(*) as new_leads 
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    
    // Get active listings
    const [listingsResult] = await pool.query(
      'SELECT COUNT(*) as active_listings FROM products WHERE is_active = TRUE'
    );
    
    // Get stock levels (percentage of products with good stock)
    const [stockResult] = await pool.query(`
      SELECT 
        ROUND((COUNT(CASE WHEN stock_quantity > 10 THEN 1 END) / COUNT(*)) * 100) as stock_percentage
      FROM products 
      WHERE is_active = TRUE
    `);
    
    // Get recent orders count
    const [recentOrdersResult] = await pool.query(`
      SELECT COUNT(*) as recent_orders 
      FROM orders 
      WHERE order_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    
    res.status(200).json({
      totalSales: salesResult[0].total_sales,
      newLeads: leadsResult[0].new_leads,
      activeListings: listingsResult[0].active_listings,
      stockLevels: stockResult[0].stock_percentage,
      recentOrders: recentOrdersResult[0].recent_orders
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Server error fetching statistics.' });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination
 * @access  Admin only
 */
router.get('/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { search, role, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT user_id, email, first_name, last_name, role, created_at,
        (SELECT COUNT(*) FROM orders WHERE user_id = users.user_id) as order_count
      FROM users
      WHERE 1=1
    `;
    const params = [];
    
    if (search) {
      query += ` AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const [users] = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = params.slice(0, -2); // Remove limit and offset
    
    if (search) {
      countQuery += ` AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)`;
    }
    if (role) {
      countQuery += ` AND role = ?`;
    }
    
    const [countResult] = await pool.query(countQuery, countParams);
    
    res.status(200).json({
      users,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error fetching users.' });
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user role or status
 * @access  Admin only
 */
router.put('/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Valid role (user or admin) is required.' });
    }
    
    // Prevent admin from demoting themselves
    if (req.session.user.id == id && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot change your own admin role.' });
    }
    
    const [result] = await pool.query(
      'UPDATE users SET role = ? WHERE user_id = ?',
      [role, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    res.status(200).json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error updating user.' });
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user details with orders
 * @access  Admin only
 */
router.get('/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await pool.query(
      'SELECT user_id, email, first_name, last_name, role, created_at FROM users WHERE user_id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    const user = users[0];
    
    // Get user's orders
    const [orders] = await pool.query(`
      SELECT order_id, order_date, total_amount, status
      FROM orders
      WHERE user_id = ?
      ORDER BY order_date DESC
      LIMIT 10
    `, [id]);
    
    // Get user's addresses
    const [addresses] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ?',
      [id]
    );
    
    res.status(200).json({
      ...user,
      orders,
      addresses
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error fetching user.' });
  }
});

/**
 * @route   GET /api/admin/inventory
 * @desc    Get inventory status
 * @access  Admin only
 */
router.get('/inventory', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { low_stock_threshold = 10 } = req.query;
    
    // Get low stock items
    const [lowStock] = await pool.query(`
      SELECT product_id, name, sku, stock_quantity, material_type
      FROM products
      WHERE is_active = TRUE AND stock_quantity <= ?
      ORDER BY stock_quantity ASC
    `, [low_stock_threshold]);
    
    // Get stock by material type
    const [stockByType] = await pool.query(`
      SELECT material_type, SUM(stock_quantity) as total_stock, COUNT(*) as product_count
      FROM products
      WHERE is_active = TRUE
      GROUP BY material_type
    `);
    
    res.status(200).json({
      lowStock,
      stockByType
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Server error fetching inventory.' });
  }
});

module.exports = router;
