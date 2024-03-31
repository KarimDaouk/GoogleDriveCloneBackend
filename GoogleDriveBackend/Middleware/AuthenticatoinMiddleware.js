const jwt = require('jsonwebtoken');
const { builtinModules } = require('module');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // if there isn't any token

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403); // token is no longer valid
    req.user = user;
    next(); // pass the execution off to whatever request the client intended
  });
};

module.exports= authenticateToken;