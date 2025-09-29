const express = require('express');
const app = express();
const cors = require('cors');
const connection = require("./db");
const adminRouter = require('./routes/admin');
require('dotenv').config();

const corsOptions = {
    origin: "*", // Allow all domains
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: false
};

app.use(cors(corsOptions));

// ✅ Increase body size limit (important for Quill Base64 images)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use('/api/admin', adminRouter);

const port = process.env.PORT || 5000;

connection()
  .then(() => {
    console.log("Database Connected Successfully");
    app.listen(port, () => console.log(`Server running on Port ${port}`));
  })
  .catch((err) => {
    console.error("Database Connection Failed:", err);
  });
