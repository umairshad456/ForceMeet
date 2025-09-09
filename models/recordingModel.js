const mongoose = require('mongoose');


const callRecordingSchema = {
    filename: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    start_time: {
        type: Date,
        required: true
    },
    end_time: {
        type: Date,
        required: true
    },
    sessionId: {
        type: String,
        required: true
    },
}


const recordingSchema = new mongoose.Schema({
    callId: {
        type: String,
        required: true,
        unique: true
    },
    call_recordings: [callRecordingSchema]

}, { timestamps: true });

module.exports = mongoose.model('Recording', recordingSchema);

