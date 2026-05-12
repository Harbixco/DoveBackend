const mongoose = require("mongoose");

function arrayLimit(val) {
  return val.length >= 1;
}

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  price: {
    type: Number,
    required: true,
  },

  oldPrice: {
    type: Number,
    required: false,
  },

  images: {
    type: [String],
    required: true,
    validate: [arrayLimit, "{PATH} must have at least 3 images"],
  },

  // ✅ Must match exactly what your AddProduct/EditProduct frontend sends
  category: {
    type: String,
    required: true,
    default: "Powerbank",
  },

  // ✅ Updated to match all options in your frontend dropdowns
  brand: {
    type: String,
    required: true,
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

module.exports = mongoose.model("Product", productSchema);
