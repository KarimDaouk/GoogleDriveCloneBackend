const mongoose = require('mongoose');

const mongoURI = 'mongodb://localhost:27017/GoogleDrive'; // Replace with your MongoDB URI

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error(err.message);
    process.exit(1); 
  }
};

module.exports = connectDB;

