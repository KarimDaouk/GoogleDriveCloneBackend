const express = require('express');
const router = express.Router();
const userController = require('../Controllers/UserController'); 

router.get("/", userController.getAllUsers);

router.get("/:id", userController.getUserById);

router.put("/:id", userController.updateUserById);

router.delete("/:id", userController.deleteUserById);

router.post("/", userController.createUser); 


module.exports = router;
