const notificationModel = require('../models/notificationModel');
const meetingModel = require('../models/meetingModel');

//  =============================== Get Pending Host Requests ===============================
exports.getPendingHostRequests = async (req, res) => {
    try {
        const { userId, callId } = req.query;

        if (!userId || !callId) {
            return res.status(400).json({
                message: 'Missing userId or callId'
            });
        }

        const notification = await notificationModel.findOne({
            receiverId: userId,
            type: 'host_request',
            status: 'pending',
        }).sort({ createdAt: -1 });

        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

//  =============================== Respond to Host Requests ===============================
exports.respondToHostRequests = async (req, res) => {
    try {

        const { notificationId, response, userId, callId } = req.body;

        if (!notificationId || !userId || !callId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Find and update the notification
        const notification = await notificationModel.findById(notificationId);
        if (!notification) {
            return res.status(404).json(
                { message: 'Notification not found' },
            );
        }

        if (notification.receiverId !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (notification.status !== 'pending') {
            return res.status(400).json({ message: 'Request already processed' });
        }

        const meeting = await meetingModel.findOne({ callId });
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        if (response) {
            // If accepted, make the user a host
            const participantIndex = meeting.participants.findIndex(
                (p) => p.userId === userId
            );

            if (participantIndex === -1) {
                return res.status(404).json({ message: 'Participant not found in meeting' });
            }

            meeting.participants[participantIndex].isHost = true;
            meeting.markModified('participants');
            await meeting.save();
        }

        // delete the notfication
        await notificationModel.findByIdAndDelete(notificationId)

        return res.status(200).json({
            success: true,
            message: response
                ? 'You have accepted the host role'
                : 'You have declined the host role',
            isHost: response,
            callId,
        });
    } catch (error) {
        console.error('Error responding to host request:', error);
        return status(500).json({ error: 'Internal server error' });
    }
}

// =============================== Get Pending Participant Requests ===============================
exports.getPendingParticipantRequests = async (req, res) => {
    try {
        const { callId } = req.query;

        if (!callId) {
            return res.status(400).json({
                message: 'Missing callId'
            });
        }

        const meeting = await meetingModel.findOne({ callId })
            .select('participants')
            .lean();

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        const pendingParticipants = meeting.participants
            .filter((p) => p.status === 'pending')
            .map((p) => ({
                userId: p.userId,
                name: p.name,
                email: p.email,
                _id: p._id?.toString(),
            }));

        res.status(200).json({ participants: pendingParticipants });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// =============================== Handle Participant Requests ===============================
exports.handleParticipantRequests = async (req, res) => {
    try {
        const { callId, participantId, action } = req.body;

        if (!callId || !participantId || !action) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const meeting = await meetingModel.findOne({ callId });
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        const participantIndex = meeting.participants.findIndex(
            (p) => p._id?.toString() === participantId && p.status === 'pending'
        );

        if (participantIndex === -1) {
            return res.status(404).json({ message: 'Pending participant not found' });
        }

        if (action === 'accept') {
            meeting.participants[participantIndex].status = 'approved';
        } else if (action === 'reject') {
            meeting.participants[participantIndex].status = 'rejected';
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        meeting.markModified('participants');
        await meeting.save();

        return res.status(200).json({
            success: true,
            message: `Participant request has been ${action}ed`,
            participantId,
            action,
        });
    } catch (error) {
        console.error('Error handling participant request:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


// =============================== send Host Request ===============================

exports.sendHostRequest = async (req, res) => {
    try {
        const { callId, meetingId, targetUserId, requesterId, } = req.body;

        if (!callId || !targetUserId || !requesterId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const meeting = await meetingModel.findOne({ callId });
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        const requester = meeting.participants.find(p => p.userId === requesterId);
        if (!requester || !(requester.isHost || requester.userId === meeting.creatorId)) {
            return res.status(403).json({ message: 'Only hosts can send host requests' });
        }

        const targetParticipant = meeting.participants.find(p => p.userId === targetUserId);
        if (!targetParticipant) {
            return res.status(404).json({ message: 'Target participant not found' });
        }
        if (targetParticipant.isHost) {
            return res.status(400).json({ message: 'Participant is already a host' });
        }

        console.log(`Host request sent from ${requesterId} to ${targetUserId} for meeting ${callId}`);

        const newNotification = new notificationModel({
            type: "host_request",
            callId,
            meetingId,
            senderId: requesterId,
            receiverId: targetUserId,
            status: 'pending',
        })

        await newNotification.save();

        return res.status(200).json({ message: 'Host request sent successfully' });
    } catch (error) {
        console.error('Send host request error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}