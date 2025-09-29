// models/Blog.js
const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    blogHeading: {
      type: String,
      required: true,
      trim: true,
    },
    blogDesc: {
      type: String,
      required: true,
      trim: true,
    },
    blogImage: {
      type: String, // Firebase image URL
      required: true,
    },
    blogContent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);

