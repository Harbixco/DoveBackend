const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { protect } = require("../middleware/auth.middleware");
const { upload, cloudinary } = require("../config/cloudinary");

// ─── Helper: safely delete an image from Cloudinary ──────────────────────────
// Only attempts deletion if it's a real Cloudinary URL.
// Old /uploads/ paths are silently skipped — those files are already gone.
const destroyCloudinaryImage = async (imgUrl) => {
  if (!imgUrl || !imgUrl.startsWith("https://res.cloudinary.com")) return;
  const segments = imgUrl.split("/");
  const publicId = segments
    .slice(-2)
    .join("/")
    .replace(/\.[^/.]+$/, "");
  await cloudinary.uploader.destroy(publicId);
};

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
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            await destroyCloudinaryImage(file.path);
          }
        }
        return res
          .status(400)
          .json({ message: "Minimum 3 images are required" });
      }

      if (!name || !price) {
        return res.status(400).json({ message: "Name and price are required" });
      }

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
          for (const file of req.files) {
            await destroyCloudinaryImage(file.path);
          }
          return res
            .status(400)
            .json({ message: "If updating images, provide at least 3" });
        }

        // Delete old images from Cloudinary only if they are Cloudinary URLs
        // Old /uploads/ paths are skipped safely
        const existingProduct = await Product.findById(req.params.id);
        if (existingProduct && existingProduct.images.length > 0) {
          for (const imgUrl of existingProduct.images) {
            await destroyCloudinaryImage(imgUrl);
          }
        }

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

    // Delete from Cloudinary only if URL is a Cloudinary URL
    // Old /uploads/ paths are skipped — files are already gone from Render's disk
    if (product.images && product.images.length > 0) {
      for (const imgUrl of product.images) {
        await destroyCloudinaryImage(imgUrl);
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product removed" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
