// models/ContactQuery.js
const mongoose = require("mongoose");

const contactQuerySchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    city: { type: String },
    projectType: { type: String},
    phone: { type: String, required: true },
    company: { type: String },
    message: { type: String },
    file: { type: String }, // this will store Firebase URL
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactQuery", contactQuerySchema);
