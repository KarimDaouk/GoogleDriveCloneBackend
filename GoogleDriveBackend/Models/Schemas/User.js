

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png'
  }
});

module.exports = mongoose.model('Users', UserSchema);
