const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true // Ensures no two admins have the same username
  },
  password: {
    type: String,
    required: true // This will store the hashed password, never plain text
  }
});

module.exports = mongoose.model('Admin', adminSchema);