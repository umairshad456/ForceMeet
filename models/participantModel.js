const mongoose = require('mongoose');

const InviteParticipantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
});

const InviteParticipants =
  mongoose.model('InviteParticipants', InviteParticipantSchema);

module.exports = InviteParticipants;
