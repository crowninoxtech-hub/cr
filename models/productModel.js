const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    tag: { type: String, required: true },
    description: { type: String, required: true },
    featureTitle: { type: String, required: true },
    features: [{ type: String, required: true }],
    image: { type: String, required: false }, // Firebase URL
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
