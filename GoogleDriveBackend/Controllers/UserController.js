// controllers/userController.js
const User = require("../Models/Schemas/User");
const ApiResponse = require("../Models/ApiResponse");
const bcrypt = require('bcrypt');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    const response = new ApiResponse(200, "Success", users);
    res.status(200).json(response); 
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
    console.log(req.params.id);
    const us = await User.findById(req.params.id);
    console.log(us);
    const user = await User.findByIdAndDelete(req.params.id);
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
        password: hashedPassword,
        profilePicture: req.body.profilePicture || "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png"
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

  const filterUsersByQuery = async (req, res) => {
    try {
      const userId = req.params.id;
      const searchString = req.query.filter;
  
      // Get all users
      const users = await User.find();
  
      // Filter users based on the search query and exclude the user with the specified userId
      const filteredUsers = users.filter(user =>
        user._id.toString() !== userId &&
        (user.name.toLowerCase().includes(searchString) || user.email.toLowerCase().includes(searchString))
      );
  
      // Respond with the filtered users
      res.status(200).json(new ApiResponse(200, "Users retrieved successfully", filteredUsers));
    } catch (error) {
      // Handle errors
      console.error("Error fetching users:", error);
      const response = new ApiResponse(500, "Internal Server Error", {});
      res.status(200).json(response);
    }
  };
  

module.exports = {
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  createUser,
  filterUsersByQuery
};
