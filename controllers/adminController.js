const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel"); // your Mongoose Admin model
const Category = require("../models/categoryModel");
const Tag = require("../models/tagModel");
const Blog = require("../models/blogModel");
const Product = require("../models/productModel");
const ContactQuery =require("../models/userQuery");

const adminController = {
  adminSignUp: async (req, res) => {
    try {
      const { name, email, password, confirmPassword } = req.body;

      // 1. Basic validation
      if (!name || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // 2. Email validation (simple regex)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // 3. Password match check
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      // 4. Check if email already exists
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // 5. Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 6. Create new admin
      const newAdmin = new Admin({
        name,
        email,
        password: hashedPassword,
      });

      await newAdmin.save();

      res.status(201).json({ message: "Admin registered successfully" });
    } catch (err) {
      console.error("Signup Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },

  adminLogin: async (req, res) => {
    try {
      const { email, password } = req.body;

      // 1. Check if email & password provided
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      // 2. Find admin by email
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // 3. Compare password
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // 4. Generate JWT token
      const token = jwt.sign(
        { id: admin._id, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" } // token valid for 1 day
      );

      // 5. Success response
      res.status(200).json({
        message: "Login successful",
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
        },
      });
    } catch (err) {
      console.error("Login Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },

  addCategory: async (req, res) => {
  try {
    const { name, image, video } = req.body;
    console.log(req.body);

    // ✅ Validation
    if (!name || !image || !video) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(409).json({ message: "Category already exists." });
    }

    // Create new category
    const newCategory = new Category({
      name: name.trim(),
      image: image, // URL from Firebase Storage
      video: video  // URL from Firebase Storage
    });

    // Save to DB
    await newCategory.save();

    // ✅ Fetch all categories after adding
    const allCategories = await Category.find().sort({ createdAt: -1 });

    return res.status(201).json({
      message: "Category added successfully",
      category: newCategory,
      categories: allCategories, // 👈 sending all categories
    });
  } catch (error) {
    console.error("Error adding category:", error);
    return res.status(500).json({ message: "Server Error" });
  }
},


  getCategory: async (req, res) => {
    try {
      const categories = await Category.find().sort({ createdAt: -1 }); // latest first
      res.status(200).json({
        success: true,
        message: "Categories fetched successfully",
        data: categories,
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch categories",
        error: error.message,
      });
    }
  },
  updateCategory: async (req, res) => {
  try {
    const { id } = req.params; // category ID from URL
    const { name, image, video } = req.body;

    // Find category by ID
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found!" });
    }

    // Check if another category with the same name exists
    if (name) {
      const existingCategory = await Category.findOne({
        name: name.trim(),
        _id: { $ne: id },
      });
      if (existingCategory) {
        return res
          .status(400)
          .json({ message: "Category name already exists!" });
      }

      // Update name
      category.name = name.trim();
    }

    // Update other fields if provided
    if (image) category.image = image;
    if (video) category.video = video;

    // Save updated category
    await category.save();

    // Fetch updated categories list
    const categories = await Category.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: "Category updated successfully!",
      categories,
      category, // also return the updated category
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
},



  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;

      const category = await Category.findByIdAndDelete(id);

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // ✅ Fetch all categories after delete
      const categories = await Category.find().sort({ createdAt: -1 });

      return res.status(200).json({
        message: "Category deleted successfully",
        categories,
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      return res.status(500).json({ message: "Server Error" });
    }
  },
  addTag: async (req, res) => {
    try {
      const { name } = req.body;

      // ✅ Validation
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Tag name is required" });
      }

      const trimmedName = name.trim();

      // ✅ Check if tag already exists (case-insensitive)
      const existingTag = await Tag.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
      });

      if (existingTag) {
        return res.status(400).json({ message: "Tag already exists" });
      }

      // ✅ Create new tag
      const newTag = new Tag({ name: trimmedName });
      await newTag.save();

      // ✅ Get all tags after adding
      const tags = await Tag.find().sort({ createdAt: -1 });

      return res.status(201).json({
        message: "Tag added successfully",
        tags, // send all tags in response
      });
    } catch (err) {
      console.error("Add Tag Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  },

  getTag: async (req, res) => {
    try {
      const tags = await Tag.find().sort({ createdAt: -1 }); // latest first
      res.status(200).json({
        success: true,
        count: tags.length,
        tags,
      });
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch tags",
      });
    }
  },
  updateTag: async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Tag name is required" });
      }

      // 🔍 Check if tag already exists (excluding the one being updated)
      const existingTag = await Tag.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") }, // case insensitive
        _id: { $ne: id },
      });

      if (existingTag) {
        return res.status(400).json({ message: "Tag already exists" });
      }

      // ✅ Update tag
      const updatedTag = await Tag.findByIdAndUpdate(
        id,
        { name: name.trim() },
        { new: true }
      );

      if (!updatedTag) {
        return res.status(404).json({ message: "Tag not found" });
      }

      // ✅ Fetch all tags after update
      const tags = await Tag.find().sort({ createdAt: -1 });

      res.status(200).json({
        message: "Tag updated successfully",
        tag: updatedTag,
        tags,
      });
    } catch (err) {
      console.error("Update Tag Error:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
  deleteTag: async (req, res) => {
    try {
      const { id } = req.params;

      const tag = await Tag.findById(id);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }

      await Tag.findByIdAndDelete(id);

      const tags = await Tag.find().sort({ createdAt: -1 }); // return updated list
      res.json({ message: "Tag deleted successfully", tags });
    } catch (error) {
      console.error("Delete Tag Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  addBlogs: async (req, res) => {
    try {
      const { blogHeading, blogDesc, blogImage, blogContent } = req.body;

      // ✅ Validation
      if (!blogHeading || !blogDesc || !blogImage) {
        return res.status(400).json({
          success: false,
          message: "Blog heading, description, and image are required",
        });
      }

      // ✅ Create new blog
      const newBlog = new Blog({
        blogHeading,
        blogDesc,
        blogImage, // already Firebase URL
        blogContent,
      });

      await newBlog.save();

      // ✅ Fetch all blogs after insertion
      const allBlogs = await Blog.find().sort({ createdAt: -1 });

      return res.status(201).json({
        success: true,
        message: "Blog added successfully",
        newBlog,
        blogs: allBlogs,
      });
    } catch (error) {
      console.error("Error adding blog:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
  getAllBlog: async (req, res) => {
    try {
      // Fetch all blogs from the database, latest first
      const blogs = await Blog.find().sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: "Blogs fetched successfully",
        data: blogs,
      });
    } catch (error) {
      console.error("Error fetching blogs:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
 getLatestBlog: async (req, res) => {
    try {
      const blogs = await Blog.find()
        .sort({ createdAt: -1 }) // newest first
        .limit(3);               // only 3 blogs

      res.status(200).json({
        success: true,
        data:blogs,
      });
    } catch (error) {
      console.error("Error fetching latest blogs:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching latest blogs",
      });
    }
  },

  editBlog: async (req, res) => {
    try {
      const blogId = req.params.id;
      const { blogHeading, blogDesc, blogImage, blogContent } = req.body;

      // Check blog exists
      const blog = await Blog.findById(blogId);
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: "Blog not found",
        });
      }

      // Update fields
      blog.blogHeading = blogHeading || blog.blogHeading;
      blog.blogDesc = blogDesc || blog.blogDesc;
      blog.blogImage = blogImage || blog.blogImage;
      blog.blogContent = blogContent || blog.blogContent;

      const updatedBlog = await blog.save();

      // ✅ Fetch all blogs after update
      const allBlogs = await Blog.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        message: "Blog updated successfully",
        updatedBlog,
        blogs: allBlogs, // send all blogs in response
      });
    } catch (error) {
      console.error("Error updating blog:", error);
      res.status(500).json({
        success: false,
        message: "Server error while updating blog",
        error: error.message,
      });
    }
  },
  deleteBlog: async (req, res) => {
    try {
      const blogId = req.params.id;

      // Find the blog
      const blog = await Blog.findById(blogId);
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: "Blog not found",
        });
      }

      // Delete the blog from DB
      await Blog.findByIdAndDelete(blogId);

      // Fetch all remaining blogs
      const allBlogs = await Blog.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        message: "Blog deleted successfully",
        blogs: allBlogs, // send updated blogs list to frontend
      });
    } catch (error) {
      console.error("Error deleting blog:", error);
      res.status(500).json({
        success: false,
        message: "Server error while deleting blog",
        error: error.message,
      });
    }
  },
  getSinleBlog: async (req, res) => {
    try {
      const { id } = req.params; // extract blog ID from URL
      console.log("Fetching blog with ID:", id);

      const blog = await Blog.findById(id);

      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      res.status(200).json(blog);
    } catch (error) {
      console.error("Error fetching single blog:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
addProduct: async (req, res) => {
  try {
    const { name, category, tag, description, featureTitle, features, image } = req.body;

    // 1. Validation
    if (!name || !category || !tag || !description || !featureTitle || !image) {
      return res.status(400).json({
        success: false,
        message: "Product name, category, tag, description, feature title, and image are required!",
      });
    }

    // 2. Check if product already exists (case-insensitive)
    const existingProduct = await Product.findOne({ name: name.trim() });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product already exists!",
      });
    }

    // 3. Create new product
    const newProduct = new Product({
      name: name.trim(),
      category,
      tag,
      description,
      featureTitle: featureTitle.trim(),
      features: Array.isArray(features) ? features : [],
      image,
    });

    await newProduct.save();

    return res.status(201).json({
      success: true,
      message: "Product added successfully!",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
},


getAllProduct: async (req, res) => {
    try {
      // Fetch all products, latest first
      const products = await Product.find().sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        data: products,
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({
        success: false,
        message: "Server error. Please try again later.",
      });
    }
  },
// ✅ Update Product Controller
updateProduct: async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, tag, description, image, featureTitle, features } = req.body;
    console.log(req.body);

    // 1. Validation
    if (!name || !category || !tag || !description || !image) {
      return res.status(400).json({
        success: false,
        message: "All fields are required!",
      });
    }

    // 2. Check for duplicate product name (excluding current product)
    const existingProduct = await Product.findOne({
      'name.en': name.trim(),
      _id: { $ne: id },
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Another product with the same name already exists!",
      });
    }

    // 3. Update product (Arabic already provided in req.body if needed)
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        category,
        tag,
        description,
        image,
        featureTitle,
        features,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully!",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
},

deleteProduct: async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
},
  getSingleProduct: async (req, res) => {
    try {
      const { id } = req.params; // ✅ get id from URL
      console.log("Requested Product ID:", id);

      // Find product by ID
      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching product",
      });
    }
  },
 addUserQuery : async (req, res) => {
  try {
    const {
      fullName,
      email,
      city,
      projectType,
      phone,
      company,
      message,
      file,
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Full Name, Email, City, Project Type, and Phone are required",
      });
    }

    // Create new document
    const newQuery = new ContactQuery({
      fullName,
      email,
      city,
      projectType,
      phone,
      company,
      message,
      file,
    });

    // Save to DB
    await newQuery.save();

    res.status(201).json({
      success: true,
      message: "Contact query submitted successfully",
    });
  } catch (error) {
    console.error("Error in addUserQuery:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
},
getUserQuery:(req,res)=>{
}

};

module.exports = adminController;
