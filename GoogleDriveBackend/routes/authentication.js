const express = require('express');
const router = express.Router();
const authConroller = require('../Controllers/AuthenticationController'); 


router.post("/", authConroller.login);



module.exports = router;