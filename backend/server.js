const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); // Added for file paths

// Load environment variables
dotenv.config();

const app = express();

// --- MIDDLEWARE ---
app.use(cors()); 
app.use(express.json());

// ✅ 1. STATIC FOLDER FOR IMAGES
// This allows the frontend to access images at http://localhost:5000/uploads/...
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- IMPORT ROUTES ---
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');

// --- DATABASE CONNECTION ---
// ✅ 2. ADDED TIMEOUT OPTIONS
// This helps prevent the 'secureConnect' timeout errors you were seeing
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000, 
  socketTimeoutMS: 45000,         
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.log('❌ MongoDB Connection Error:', err));

// --- MOUNT ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// --- GLOBAL ERROR HANDLING ---
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Static files served from: ${path.join(__dirname, 'uploads')}`);
});