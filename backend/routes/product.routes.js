const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Product = require("../models/Product");
const { protect } = require("../middleware/auth.middleware");

// --- MULTER CONFIGURATION ---
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
});

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
      // 1. Destructure oldPrice and brand from body
      const { name, price, oldPrice, description, category, brand } = req.body;

      if (!req.files || req.files.length < 3) {
        if (req.files) {
          req.files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(400)
          .json({ message: "Minimum 3 images are required" });
      }

      if (!name || !price) {
        return res.status(400).json({ message: "Name and price are required" });
      }

      const imageUrls = req.files.map(
        (file) => `/${file.path.replace(/\\/g, "/")}`,
      );

      // 2. Include oldPrice in the new instance
      const product = new Product({
        name,
        price,
        oldPrice: oldPrice || undefined, // ✅ Ensure it's included
        images: imageUrls,
        description,
        category,
        brand, // ✅ Added brand to match your frontend form
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

      // 3. Clean up oldPrice if it's an empty string or missing
      if (!updateData.oldPrice || updateData.oldPrice === "") {
        // If your schema allows it to be optional, we delete it or set to null
        delete updateData.oldPrice;
      }

      if (req.files && req.files.length > 0) {
        if (req.files.length < 3) {
          req.files.forEach((file) => fs.unlinkSync(file.path));
          return res
            .status(400)
            .json({ message: "If updating images, provide at least 3" });
        }
        updateData.images = req.files.map(
          (file) => `/${file.path.replace(/\\/g, "/")}`,
        );
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

    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        const filePath = path.join(__dirname, "..", img);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product removed" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
