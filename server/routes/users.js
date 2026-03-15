const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    const [users] = await pool.query(
      'SELECT user_id, email, first_name, last_name, role, created_at FROM users WHERE user_id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    res.status(200).json(users[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
});

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { firstName, lastName } = req.body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required.' });
    }
    
    await pool.query(
      'UPDATE users SET first_name = ?, last_name = ? WHERE user_id = ?',
      [firstName, lastName, userId]
    );
    
    // Update session
    req.session.user.firstName = firstName;
    req.session.user.lastName = lastName;
    
    res.status(200).json({ 
      message: 'Profile updated successfully',
      user: req.session.user
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

/**
 * @route   GET /api/users/addresses
 * @desc    Get user's addresses
 * @access  Private
 */
router.get('/addresses', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    const [addresses] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default_shipping DESC, is_default_billing DESC',
      [userId]
    );
    
    res.status(200).json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ error: 'Server error fetching addresses.' });
  }
});

/**
 * @route   POST /api/users/addresses
 * @desc    Add a new address
 * @access  Private
 */
router.post('/addresses', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { 
      address_line1, 
      address_line2, 
      city, 
      state_province, 
      postal_code, 
      country,
      is_default_shipping,
      is_default_billing
    } = req.body;
    
    if (!address_line1 || !city || !postal_code || !country) {
      return res.status(400).json({ 
        error: 'Address line 1, city, postal code, and country are required.' 
      });
    }
    
    // If this is set as default, unset other defaults
    if (is_default_shipping) {
      await pool.query(
        'UPDATE addresses SET is_default_shipping = FALSE WHERE user_id = ?',
        [userId]
      );
    }
    
    if (is_default_billing) {
      await pool.query(
        'UPDATE addresses SET is_default_billing = FALSE WHERE user_id = ?',
        [userId]
      );
    }
    
    const [result] = await pool.query(
      `INSERT INTO addresses 
       (user_id, address_line1, address_line2, city, state_province, postal_code, country, is_default_shipping, is_default_billing)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, address_line1, address_line2, city, state_province, postal_code, country, is_default_shipping || false, is_default_billing || false]
    );
    
    res.status(201).json({
      message: 'Address added successfully',
      addressId: result.insertId
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ error: 'Server error adding address.' });
  }
});

/**
 * @route   PUT /api/users/addresses/:id
 * @desc    Update an address
 * @access  Private
 */
router.put('/addresses/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    const { 
      address_line1, 
      address_line2, 
      city, 
      state_province, 
      postal_code, 
      country,
      is_default_shipping,
      is_default_billing
    } = req.body;
    
    // Verify ownership
    const [existing] = await pool.query(
      'SELECT address_id FROM addresses WHERE address_id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Address not found.' });
    }
    
    // If this is set as default, unset other defaults
    if (is_default_shipping) {
      await pool.query(
        'UPDATE addresses SET is_default_shipping = FALSE WHERE user_id = ?',
        [userId]
      );
    }
    
    if (is_default_billing) {
      await pool.query(
        'UPDATE addresses SET is_default_billing = FALSE WHERE user_id = ?',
        [userId]
      );
    }
    
    await pool.query(
      `UPDATE addresses 
       SET address_line1 = ?, address_line2 = ?, city = ?, state_province = ?, postal_code = ?, country = ?, is_default_shipping = ?, is_default_billing = ?
       WHERE address_id = ?`,
      [address_line1, address_line2, city, state_province, postal_code, country, is_default_shipping || false, is_default_billing || false, id]
    );
    
    res.status(200).json({ message: 'Address updated successfully.' });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Server error updating address.' });
  }
});

/**
 * @route   DELETE /api/users/addresses/:id
 * @desc    Delete an address
 * @access  Private
 */
router.delete('/addresses/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    
    // Check if address is used in any orders
    const [orders] = await pool.query(
      'SELECT order_id FROM orders WHERE shipping_address_id = ? OR billing_address_id = ?',
      [id, id]
    );
    
    if (orders.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete address used in existing orders.' 
      });
    }
    
    const [result] = await pool.query(
      'DELETE FROM addresses WHERE address_id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Address not found.' });
    }
    
    res.status(200).json({ message: 'Address deleted successfully.' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Server error deleting address.' });
  }
});

module.exports = router;
