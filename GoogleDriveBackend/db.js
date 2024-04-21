const mongoose = require('mongoose');

const mongoURI = 'mongodb://localhost:27017/GoogleDrive'; 
//const mongoURI ='mongodb+srv://KarimDaouk:Wd03405224@googledriveclone.trdr6wx.mongodb.net/GoogleDrive?retryWrites=true&w=majority'

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

