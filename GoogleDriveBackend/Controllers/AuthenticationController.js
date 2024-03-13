// controllers/authenticationController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // For generating JWT tokens
const User = require('../Models/Schemas/User'); // Assuming you have a User model defined
const ApiResponse = require('../Models/APIResponse');
require('dotenv').config();

const secretKey = process.env.SECRET_KEY;



const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user with provided email exists
    const user = await User.findOne({ email });

    if (!user) {
     const response = new ApiResponse(401, "User Not found",{});
      return res.status(200).json(response);
    }

    // Check if password is correct
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
     const response = new ApiResponse(401, "Incorrect Password",{});
      return res.status(200).json(response);
    }

    // If credentials are correct, generate JWT token and add it to the user Object
    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
    user.token= token;

    // Send token in response
    const response = new ApiResponse(200, "Login Successful",user)
    res.status(200).json({ response });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login
};
