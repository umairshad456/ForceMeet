const mongoose = require("mongoose");

const meetingInviteSchema = new mongoose.Schema(
    {
        meetingLink: {
            type: String,
            required: true,
        },
        meetingTitle: {
            type: String,
            required: true,
        },
        meetingDateTime: String,
        invitedEmails: {
            type: [String],
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);
module.exports = mongoose.model("MeetingInvite", meetingInviteSchema);
