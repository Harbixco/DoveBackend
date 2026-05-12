const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/auth.middleware');

// @route   POST /api/auth/login
// @desc    Authenticate admin & get token
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 1. Find the admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 2. Compare the plain text password with the hashed password in DB
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Create a JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '1d' // Token expires in 1 day
    });

    res.json({ message: 'Login successful', token });
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change admin password
// @access  Protected (Admin only)
router.put('/change-password', protect, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // 1. Find the currently logged-in admin
    const admin = await Admin.findById(req.adminId);

    // 2. Verify the old password
    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect old password' });
    }

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);

    // 4. Save the updated admin
    await admin.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;