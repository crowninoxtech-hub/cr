const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// auth-route
router.post("/auth/signup", adminController.adminSignUp);
router.post("/auth/login", adminController.adminLogin);
// category-route
router.get("/categories", adminController.getCategory);
router.post("/categories", adminController.addCategory);
router.put("/categories/:id", adminController.updateCategory);
router.delete("/categories/:id", adminController.deleteCategory);
// tag-route
router.get("/tags", adminController.getTag);
router.post("/tags", adminController.addTag);
router.put("/tags/:id", adminController.updateTag);
router.delete("/tags/:id", adminController.deleteTag);
// blog-route
router.post("/blogs", adminController.addBlogs);
router.get("/blogs", adminController.getAllBlog);
router.get("/blogs/latest", adminController.getLatestBlog);
router.put("/blogs/:id", adminController.editBlog);
router.delete("/blogs/:id", adminController.deleteBlog);
router.get("/blog/:id", adminController.getSinleBlog);
// product-route
router.post("/products", adminController.addProduct);
router.get("/products", adminController.getAllProduct);
router.put("/products/:id", adminController.updateProduct);
router.delete("/products/:id", adminController.deleteProduct);
router.get("/products/:id", adminController.getSingleProduct);
// user-query-route
router.post("/contact",adminController.addUserQuery);
router.get("/contact",adminController.getUserQuery);

module.exports = router;
