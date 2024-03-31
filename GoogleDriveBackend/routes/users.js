const express = require('express');
const router = express.Router();
const userController = require('../Controllers/UserController'); 
const authenticate = require('../Middleware/AuthenticatoinMiddleware');


router.get("/", authenticate, userController.getAllUsers);

router.get("/:id",authenticate,  userController.getUserById);

router.put("/:id", authenticate, userController.updateUserById);

router.delete("/:id",authenticate, userController.deleteUserById);

router.post("/", userController.createUser); 

router.get("/search/:id", authenticate, userController.filterUsersByQuery);

module.exports = router;
