const mongoose = require('mongoose');
const { Schema, model, models } = mongoose;

const NotificationSchema = new Schema({
  type: { type: String, required: true }, // e.g., 'host_request'
  callId: { type: String, required: true },
  meetingId: { type: Schema.Types.ObjectId, required: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
});

const Notification = models.Notification || model('Notification', NotificationSchema);

module.exports = Notification;