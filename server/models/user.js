const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 3,
    max: 25,
  },
  email: {
    type: String,
    required: true,
    max: 50,
    min: 3,
  },

  password: {
    type: String,
    required: true,
    default: "123456",
    min: 5,
    max: 1024,
  },
  status: {
    type: String,
    required: true,
    default: "pending verification",
  },
  activation_token: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
