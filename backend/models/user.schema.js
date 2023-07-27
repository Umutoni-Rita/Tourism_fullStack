const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    min: 2,
    max: 30,
  },
  type: {
    type: String,
    enum: ["ADMIN", "USER"],
    default: "USER",
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  message:{
    type:String,
    min:2,
    max:30,
  },
  hashedPassword: {
    type: String,
    min: 2,
    max: 30,
  },
  profilePicture: {
    type: String,
  },
  isConfirmed: {
    type: Boolean,
    default: false,
  },
});

const usersSchema = mongoose.model("users", userSchema);

module.exports = usersSchema;
