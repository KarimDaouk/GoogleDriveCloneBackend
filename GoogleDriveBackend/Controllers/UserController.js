// controllers/userController.js
const User = require("../Models/Schemas/User");
const ApiResponse = require("../Models/APIResponse");
const bcrypt = require('bcrypt');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    const response = new ApiResponse(200, "Success", users);
    res.status(200).json(users); 
  } catch (err) {
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(200).send(response);
  }
};

// Get a single user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      const response = new ApiResponse(400, "User Not found", {});
      return res.status(200).json(response);
    }
    const response = new ApiResponse(200, "Success! Returned User:", user);
    res.status(200).json(response);
  } catch (err) {
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(200).json(response);
  }
};

// Update a user by ID
const updateUserById = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    const response = new ApiResponse(200, "User Updated Successfully ", user);
    res.status(200).json(user);
  } catch (err) {
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(200).json(response);
  }
};

// Delete a user by ID
const deleteUserById = async (req, res) => {
  try {
    const user = await User.findByIdAndRemove(req.params.id);
    res.json({ msg: "User removed" });
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

// Create a new user
const createUser = async (req, res) => {
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(req.body.password, 10); 
  
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword 
      });
  
      // Save the new user to the database
      await newUser.save();
  
      const response = new ApiResponse(201, "User Created Successfully", {});
      res.status(200).json(response);
    } catch (err) {
      const response = new ApiResponse(500, "Internal Server Error", {});
      res.status(200).json(response);
    }
  };

module.exports = {
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  createUser
};
