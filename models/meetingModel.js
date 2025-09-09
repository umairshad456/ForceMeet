const mongoose = require('mongoose');
const { Schema, model } = mongoose;

// participant schema
const ParticipantSchema = new Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isHost: { type: Boolean, default: false },
  type: {
    type: String,
    enum: ["user", "invite"],
  },
  joinedAt: { type: Date, default: Date.now }
});

// meeting schema 
const MeetingSchema = new Schema({
  callId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  meetingLink: { type: String, required: true },
  meetingType: {
    type: String,
    required: true,
    enum: ['Instant Meeting', 'Scheduled Meeting', 'AppointmentScheduled']
  },
  meetingStatus: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  isPersonalRoom: { type: Boolean, default: false },
  requiresJoinRequest: { type: Boolean, default: true },
  participants: [ParticipantSchema],
  // invitedEmails: [ParticipantSchema],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });


const Meeting = model('Meeting', MeetingSchema);

module.exports = Meeting;
