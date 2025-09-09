const chatModel = require('../models/chatModel')

exports.sendMessage = async (req, res) => {
    try {
        const { callId } = req.params;
        if (!callId) {
            return res.status(400).json({ message: "Call id is required" })
        }
        const { senderId, message, senderName, senderEmail, createdAt } = req.body;

        if (!senderId || !message) {
            return res.status(400).json({ message: "senderId and message are required" });
        }

        let chat = await chatModel.findOne({ callId });

        if (!chat) {
            chat = new chatModel({
                callId,
                messages: []
            })
        }

        const newMessage = {
            senderId,
            message,
            senderName,
            senderEmail,
            createdAt: createdAt || new Date()
        }

        chat.messages.push(newMessage)

        await chat.save()
        return res.status(200).json({ message: "Message sent", data: newMessage })
    } catch (error) {
        return res.status(500).json({ message: "Error during send message" })
    }
}

exports.getMessages = async (req, res) => {
    try {
        const { callId } = req.params;
        if (!callId) {
            return res.status(400).json({ message: "Call id is required" });
        }
        const chat = await chatModel.findOne({ callId });
        if (!chat) {
            return res.status(200).json({ messages: [] });
        }

        return res.status(200).json({ messages: chat?.messages });
    } catch (error) {
        console.error("Error in getMessages:", error);
        return res.status(500).json({ message: "Error during get messages" });
    }
}
