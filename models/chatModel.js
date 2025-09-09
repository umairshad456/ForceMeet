const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    senderId: { type: String, required: true },
    senderName: { type: String },
    senderEmail: { type: String },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema({
    callId: { type: String, required: true, unique: true },
    messages: [messageSchema],
});

module.exports = mongoose.model("Chat", chatSchema);
