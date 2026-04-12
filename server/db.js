const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/stdout";

    // Log the actual URI (first 50 chars + last 50 chars to see structure)
    if (mongoUri.length > 100) {
      console.log("URI Length:", mongoUri.length);
      console.log("First 60 chars:", mongoUri.substring(0, 60));
      console.log("Last 50 chars:", mongoUri.substring(mongoUri.length - 50));
    }

    // Check if using Atlas or localhost
    if (mongoUri.includes("mongodb+srv")) {
      console.log("✓ Using MongoDB Atlas");
    } else {
      console.log("⚠ Using local MongoDB - not Atlas");
    }

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log("✓ MongoDB connected successfully");
  } catch (err) {
    console.error("✗ MongoDB connection error:", err.message);
    if (err.message.includes("malformed")) {
      console.error("Debug - Full URI:", process.env.MONGODB_URI);
    }
    console.warn("Server still running despite MongoDB error - auth will fail");
  }
};

module.exports = connectDB;
