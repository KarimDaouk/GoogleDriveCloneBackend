const multer = require('multer');
const path = require('path');

// Define storage options for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'Uploads/'); // Make sure this folder exists in your project directory
  },
  filename: function (req, file, cb) {
    // Use the original filename or customize it
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Initialize multer with the storage options
const upload = multer({ storage: storage });
module.exports = upload;