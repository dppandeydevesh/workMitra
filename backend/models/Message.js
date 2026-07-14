const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  linkPreview: {
    title: { type: String },
    description: { type: String },
    image: { type: String },
    url: { type: String }
  }
});

module.exports = mongoose.model("Message", messageSchema);
