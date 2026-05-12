const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { protect } = require("../middleware/auth.middleware");
const { upload, cloudinary } = require("../config/cloudinary"); // ✅ replaces multer disk config

// --- ROUTES ---

// GET All Products
router.get("/", async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// POST Create Product
router.post(
  "/",
  protect,
  upload.array("images", 10),
  async (req, res, next) => {
    try {
      const { name, price, oldPrice, description, category, brand } = req.body;

      if (!req.files || req.files.length < 3) {
        // ✅ If upload failed mid-way, delete any that made it to Cloudinary
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            await cloudinary.uploader.destroy(file.filename);
          }
        }
        return res
          .status(400)
          .json({ message: "Minimum 3 images are required" });
      }

      if (!name || !price) {
        return res.status(400).json({ message: "Name and price are required" });
      }

      // ✅ Cloudinary gives us file.path which is already the full https:// URL
      const imageUrls = req.files.map((file) => file.path);

      const product = new Product({
        name,
        price,
        oldPrice: oldPrice || undefined,
        images: imageUrls,
        description,
        category,
        brand,
      });

      const savedProduct = await product.save();
      res.status(201).json(savedProduct);
    } catch (error) {
      next(error);
    }
  },
);

// PUT Update Product
router.put(
  "/:id",
  protect,
  upload.array("images", 10),
  async (req, res, next) => {
    try {
      let updateData = { ...req.body };

      if (!updateData.oldPrice || updateData.oldPrice === "") {
        delete updateData.oldPrice;
      }

      if (req.files && req.files.length > 0) {
        if (req.files.length < 3) {
          // ✅ Clean up Cloudinary uploads if validation fails
          for (const file of req.files) {
            await cloudinary.uploader.destroy(file.filename);
          }
          return res
            .status(400)
            .json({ message: "If updating images, provide at least 3" });
        }

        // ✅ Delete the OLD images from Cloudinary before saving new ones
        const existingProduct = await Product.findById(req.params.id);
        if (existingProduct && existingProduct.images.length > 0) {
          for (const imgUrl of existingProduct.images) {
            // Extract the public_id from the Cloudinary URL
            // e.g. "https://res.cloudinary.com/.../dove-phoneworld/abc123" → "dove-phoneworld/abc123"
            const segments = imgUrl.split("/");
            const publicId = segments
              .slice(-2)
              .join("/")
              .replace(/\.[^/.]+$/, "");
            await cloudinary.uploader.destroy(publicId);
          }
        }

        // ✅ Save new Cloudinary URLs
        updateData.images = req.files.map((file) => file.path);
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true },
      );

      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(updatedProduct);
    } catch (error) {
      next(error);
    }
  },
);

// DELETE Product
router.delete("/:id", protect, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // ✅ Delete all images from Cloudinary before removing the product
    if (product.images && product.images.length > 0) {
      for (const imgUrl of product.images) {
        const segments = imgUrl.split("/");
        const publicId = segments
          .slice(-2)
          .join("/")
          .replace(/\.[^/.]+$/, "");
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product removed" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
