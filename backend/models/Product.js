const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, // Removes accidental whitespace
  },
  price: {
    type: Number,
    required: true,
  },
  oldPrice: {
    type: Number,
    required: false,
  },
  // Ensure this matches the field name in your dashboard and routes
  images: {
    type: [String],
    required: true,
    validate: [arrayLimit, "{PATH} must have at least 3 images"], // Optional validation
  },
  category: {
    type: String,
    required: true,
    enum: ["Powerbank", "Solar Tank", "Electronics", "Shoes"], // Strict list of categories
    default: "Powerbank",
  },
  brand: {
    type: String,
    required: true,
    enum: ["itel", "infinix", "techno", "baseus"], // Strict list of categories
    default: "itel",
  },
  description: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Helper function to enforce the 3-image rule at the database level
function arrayLimit(val) {
  return val.length >= 3;
}

module.exports = mongoose.model("Product", productSchema);
