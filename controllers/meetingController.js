const meetingModel = require('../models/meetingModel');
const notificationModel = require('../models/notificationModel')
const MeetingInvite = require('../models/invitedParticipantModel');
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const recordingModel = require('../models/recordingModel');

// ================================ get token for stream provider ================================
exports.getTokenForStreamProvider = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("req.params", userId)
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const streamAction = require('../utils/streamAction');
        const token = await streamAction.tokenProvider(userId);
        return res.status(200).json({ token });
    } catch (error) {
        console.error('Get token error:', error);
        return res.status(500).json({ error: 'Failed to get token' });
    }
}

exports.getTokenForStreamChat = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const chatAction = require('../utils/chatToken');
        const token = await chatAction.createChatToken(userId);
        return res.status(200).json({ token });
    } catch (error) {
        console.error('Get token error:', error);
        return res.status(500).json({ error: 'Failed to get token' });
    }
}

// ========== get all schedule meetings only ===========
exports.getScheduleMeetings = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!userId) {
            res.status(404).json({ message: "User not authorized" })
        }

        const query = {
            meetingType: 'Scheduled Meeting', // Filter for only 'Scheduled Meeting'
            $or: [
                { creatorId: userId },
                { 'participants.userId': userId }
            ]
        };

        const meetings = await meetingModel.find(query);
        res.status(200).json(meetings);
    } catch (error) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

// =============== get all previous meetings ========================
exports.getAllPreviousMeetings = async (req, res) => {
    try {
        const userId = req.user.userId;
        const currentDate = new Date();

        const previousMeetings = await meetingModel.find({
            date: { $lt: currentDate },
            $or: [
                { creatorId: userId },
                { 'participants.userId': userId }
            ]
        }).populate('creatorId', 'username email');

        return res.status(200).json(previousMeetings);

    } catch (error) {
        console.error("Error fetching previous meetings:", error);
        return res.status(500).json({ message: 'Failed to fetch previous meetings', error: error.message });
    }
};

// =============== get all upcoming meetings ========================
exports.getAllUpcomingMeetings = async (req, res) => {
    try {
        const userId = req.user.userId;
        const currentDate = new Date();

        const previousMeetings = await meetingModel.find({
            date: { $gt: currentDate },
            $or: [
                { creatorId: userId },
                { 'participants.userId': userId }
            ]
        }).populate('creatorId', 'username email');

        return res.status(200).json(previousMeetings);

    } catch (error) {
        console.error("Error fetching upcoming meetings:", error);
        return res.status(500).json({ message: 'Failed to fetch upcoming meetings', error: error.message });
    }
};


// get all recorded meetings
exports.getAllRecordedMeetings = async (req, res) => {
    try {
        const recordings = await recordingModel.find({});

        if (!recordings || recordings.length === 0) {
            return res.status(200).json({ recordings: [] });
        }

        const structuredData = recordings.flatMap((rec) =>
            rec.call_recordings.map((r) => ({
                callId: rec.callId,
                filename: r.filename,
                url: r.url,
                startTime: r.start_time,
                endTime: r.end_time,
                sessionId: r.sessionId,
                createdAt: rec.createdAt,
                updatedAt: rec.updatedAt
            }))
        );

        return res.status(200).json({ recordings: structuredData });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Failed to fetch recorded meetings", error: error.message });
    }
};


//  ===================== get meeting by callId ==========================
exports.getMeetingByCallId = async (req, res) => {
    try {

        // get token from cookies
        const token = req.cookies.__Token;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized No token provided' });
        }

        // get callId from query params
        const { callId } = req.params;
        if (!callId) {
            return res.status(400).json({ message: 'Call ID is required' });
        }

        // decode the token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError.message);
            return res.status(401).json({ message: `Unauthorized: Invalid token (${jwtError.message})` });
        }
        const meeting = await meetingModel.find({ creatorId: decoded.userId, callId: callId });
        // if (!meeting || meeting.length === 0) {
        //     return res.json({ message: 'Meeting not found' });
        // }
        return res.status(200).json(meeting);
    } catch (error) {
        console.error('Get meeting by Call ID error:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

//  ===================================== create meeting =====================================
exports.createMeeting = async (req, res) => {
    try {

        // get token from cookies
        const token = req.cookies.__Token;

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        // decode the token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError.message);
            return res.status(401).json({ message: `Unauthorized: Invalid token (${jwtError.message})` });
        }

        const {
            callId,
            title,
            date,
            creatorId,
            meetingLink,
            meetingType,
            isPersonalRoom,
            selectedParticipants = [],
            externalEmails = []
        } = req.body


        // Validate required fields
        if (!callId || !title || !date || !creatorId || !meetingLink || !meetingType) {
            return res.status(400).json({ message: 'All fields are required (callId, title, date, creatorId, meetingLink, meetingType)' });
        }

        // Ensure the creatorId matches the authenticated user
        if (creatorId !== decoded.userId) {
            console.warn(`Creator ID mismatch: Request creatorId (${creatorId}) vs Token userId (${decoded.userId})`);
            return res.status(403).json({ message: 'Unauthorized: Creator ID mismatch' });
        }

        // Creator (Host)
        const participants = [
            {
                userId: decoded.userId,
                name: decoded.name || 'Creator',
                email: decoded.email,
                status: 'approved',
                isHost: true,
                type: "user"
            },
        ];

        // Add internal participants
        if (selectedParticipants.length > 0) {
            const mappedInternal = selectedParticipants.map((p) => ({
                userId: p._id,
                name: p.username,
                email: p.email,
                status: 'pending',
                isHost: false,
                type: "user"
            }));
            participants.push(...mappedInternal);
        }

        // Add external emails
        if (externalEmails.length > 0) {
            const invitedEmails = externalEmails.map((email) => ({
                userId: uuidv4(),
                email,
                name: email.split("@")[0],
                status: "pending",
                isHost: false,
                type: "invite"
            }));
            participants.push(...invitedEmails)
        }

        const payloadToSave = {
            callId,
            title,
            date: new Date(date),
            creatorId,
            meetingLink,
            meetingType,
            isPersonalRoom: !!isPersonalRoom,
            requiresJoinRequest: !isPersonalRoom,
            participants,
            createdAt: new Date(),
        }

        const meeting = new meetingModel(payloadToSave);
        const savedMeeting = await meeting.save();

        return res.status(201).json({ message: 'Meeting created successfully', meeting: savedMeeting });
    } catch (error) {
        console.log('create meeting error', error)
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// ================================== send email invite ===============================
exports.sendInvite = async (req, res) => {
    try {
        const { emails, meetingLink, title, date, time } = req.body;
        // const userId = req.user.userId;


        if (!emails || emails.length === 0) {
            return res.status(400).json({ error: "No emails provided" });
        }

        // const query = { meetingLink: meetingLink };
        // const update = {
        //     $addToSet: { invitedEmails: { $each: emails } },
        //     meetingTitle: title,
        //     meetingDateTime: new Date(`${date}T${time}`),
        //     createdBy: userId,
        // };
        // const options = {
        //     upsert: true, // Creates a new document if one is not found
        //     new: true, // Returns the modified document rather than the original
        //     setDefaultsOnInsert: true, // Applies schema defaults on new documents
        // };

        // const existingMeeting = await MeetingInvite.findOneAndUpdate(query, update, options);

        // // Send mails to the newly added participants only
        // const newlyAddedEmails = emails.filter(email => !existingMeeting.invitedEmails.includes(email));

        // if (newlyAddedEmails.length === 0) {
        //     return res.status(200).json({ message: 'No new invites to send' });
        // }

        // Setup mailer
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Send mails in parallel to only the new emails
        const sendMailPromises = emails.map((email) =>
            transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: `You're Invited: ${title}`,
                html: `
          <div style="font-family: 'Segoe UI', sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #e0e0e0; border-radius:10px; background-color:#f9f9f9;">
            <h2 style="text-align:center; color:#1D4ED8;">📅 You're Invited to a Meeting!</h2>
            <p style="font-size:16px;">You have been invited to the following meeting:</p>
            <table style="width:100%; margin-top:15px; border-collapse:collapse;">
              <tr><td style="font-weight:bold; padding:8px;">Title:</td><td>${title}</td></tr>
              <tr><td style="font-weight:bold; padding:8px;">Date:</td><td>${date}</td></tr>
              <tr><td style="font-weight:bold; padding:8px;">Time:</td><td>${time}</td></tr>
            </table>
            <div style="text-align:center; margin-top:20px;">
              <a href="${meetingLink}" style="display:inline-block; background-color:#1D4ED8; color:#fff; padding:12px 25px; border-radius:6px; text-decoration:none; font-weight:bold;">
                Join Meeting
              </a>
            </div>
          </div>
        `,
            })
        );

        await Promise.all(sendMailPromises);

        return res.status(200).json({ message: 'Invite sent successfully' });
    } catch (error) {
        console.error('Send invite error:', error);
        return res.status(500).json({ error: 'Failed to send invite' });
    }
};

//  ========================== get user role and permissions for a specific meeting ====================
exports.getUserRolesandPermission = async (req, res) => {
    try {

        const { callId, userId } = req.params;

        if (!callId || !userId) {
            return res.status(400).json(
                { error: 'Call ID and User ID are required' });
        }

        // console.log(req.params.callId)

        const meeting = await meetingModel.findOne({ callId });
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        const participant = meeting.participants.find((p) => p.userId === userId);
        if (!participant) {
            return res.status(404).json({ message: 'Participant not found' });
        }

        const isCreator = participant.userId === meeting.creatorId.toString();
        const isCoHost = participant.isHost;

        return res.status(200).json({
            role: isCreator ? 'host' : isCoHost ? 'cohost' : 'participant',
            permissions: {
                canManageParticipants: isCreator || isCoHost,
                canEndCall: isCreator || isCoHost,
                canViewStats: isCreator || isCoHost,
                canModifyHosts: isCreator // Only main host can modify host status
            },
            dbData: {
                isHost: participant.isHost,
                isCreator,
                updatedAt: meeting.updatedAt,
                meetingId: meeting._id,
            }
        });
    } catch (error) {
        console.error('Error getting user role:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

//  ============================ check participant status ============================
exports.checkParticipantStatus = async (req, res) => {
    try {

        const { callId, email } = await req.body;

        if (!callId || !email) {
            return res.status(400).json({ message: 'Call ID and email are required' });
        }

        const meeting = await meetingModel.findOne({ callId });

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        const existingParticipant = meeting.participants.find(
            (p) => p.email?.toLowerCase() === email.toLowerCase()
        );

        if (existingParticipant) {
            return res.status(200).json({
                exists: true,
                status: existingParticipant.status,
                userId: existingParticipant.userId,
                name: existingParticipant.name,
                email: existingParticipant.email,
            });
        } else {
            return res.status(200).json({ exists: false });
        }
    } catch (error) {
        console.error('Error checking participant status:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

//  ============================ join request ============================
// exports.joinRequest = async (req, res) => {
//     try {
//         const { callId, name, email, userId, status } = req.body;

//         if (!callId || !name || !email) {
//             return res.status(400).json({ message: 'Call ID, name, and email are required' });
//         }

//         const updatedMeeting = await meetingModel.findOneAndUpdate(
//             { callId },
//             {
//                 $push: {
//                     participants: {
//                         userId,
//                         name,
//                         email,
//                         status: status || "pending",
//                         type: "user",
//                     },
//                 },
//             },
//             { new: true }
//         );
//         if (!updatedMeeting) {
//             return res.status(404).json({ message: 'Meeting not found' });
//         }
//         return res.status(200).json({ message: 'Join request submitted', meeting: updatedMeeting });
//     } catch (error) {
//         console.error('Join request error:', error);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// }


exports.joinRequest = async (req, res) => {
    try {
        const { callId, name, email, userId } = req.body;

        if (!callId || !name || !email || !userId) {
            return res.status(400).json({ message: "Call ID, name, email, and userId are required" });
        }

        // Find meeting
        const meeting = await meetingModel.findOne({ callId });
        if (!meeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        // Find participant if exists
        const existingParticipant = meeting.participants.find(p => p.userId === userId);

        if (existingParticipant) {
            if (existingParticipant.status === "rejected") {
                // 🔄 Update rejected user back to pending
                existingParticipant.status = "pending";
                existingParticipant.name = name;
                existingParticipant.email = email;

                await meeting.save();

                // Create new notification for host
                const notification = new notificationModel({
                    type: "join_request",
                    callId,
                    meetingId: meeting._id,
                    senderId: userId, // user requesting
                    receiverId: meeting.creatorId.toString(), // host
                    status: "pending",
                });
                await notification.save();

                return res.status(200).json({
                    message: "Join request re-submitted after rejection",
                    meeting,
                    notification,
                });
            } else if (existingParticipant.status === "pending") {
                return res.status(400).json({ message: "Your request is already pending. Please wait for host approval." });
            } else if (existingParticipant.status === "approved") {
                return res.status(400).json({ message: "You are already approved for this meeting." });
            }
        }

        // If not exists, add as new participant
        meeting.participants.push({
            userId,
            name,
            email,
            status: "pending",
            type: "user",
        });
        await meeting.save();

        // Create notification for host
        const notification = new notificationModel({
            type: "join_request",
            callId,
            meetingId: meeting._id,
            senderId: userId,
            receiverId: meeting.creatorId.toString(),
            status: "pending",
        });
        await notification.save();

        return res.status(200).json({
            message: "Join request submitted",
            meeting,
            notification,
        });

    } catch (error) {
        console.error("Join request error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


// exports.joinRequest = async (req, res) => {
//     try {
//         const { callId, name, email, userId } = req.body;

//         if (!callId || !name || !email || !userId) {
//             return res.status(400).json({ message: 'Call ID, name, email, and userId are required' });
//         }

//         // Find meeting
//         const meeting = await meetingModel.findOne({ callId });
//         if (!meeting) {
//             return res.status(404).json({ message: 'Meeting not found' });
//         }

//         // Check if user already exists in participants
//         const alreadyParticipant = meeting.participants.some(
//             p => p.userId === userId
//         );
//         if (alreadyParticipant) {
//             return res.status(400).json({ message: 'User already requested to join' });
//         }

//         // Add to participants as pending
//         meeting.participants.push({
//             userId,
//             name,
//             email,
//             status: "pending",
//             type: "user",
//         });
//         await meeting.save();

//         // Create notification for the meeting creator (host)
//         const notification = new notificationModel({
//             type: "join_request",
//             callId,
//             meetingId: meeting._id,
//             senderId: userId,           // user requesting
//             receiverId: meeting.creatorId.toString(), // host
//             status: "pending"
//         });
//         await notification.save();

//         return res.status(200).json({
//             message: "Join request submitted",
//             meeting,
//             notification
//         });

//     } catch (error) {
//         console.error("Join request error:", error);
//         return res.status(500).json({ message: "Internal server error" });
//     }
// };



//  ============================ check approval status ============================
exports.checkAprrovalStatus = async (req, res) => {
    try {

        const { callId, userId } = req.params;
        if (!callId || !userId) {
            return res.status(400).json({ message: 'Call ID and User ID are required' });
        }

        const meeting = await meetingModel.findOne({ callId })
            .select('participants')
            .lean();

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        const participant = meeting.participants.find(
            (p) => p.userId === userId
        );

        if (!participant) {
            return res.status(404).json({ message: 'Participant not found' });
        }

        return res.status(200).json({
            status: participant.status,
            message: participant.status === 'approved'
                ? 'You have been approved to join the meeting'
                : participant.status === 'rejected'
                    ? 'Your request has been rejected'
                    : 'Your request is still pending'
        });

    } catch (error) {
        console.error('Check approval status error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// =============================== fetch Participant  ===============================
exports.fetchParticipants = async (req, res) => {
    try {
        const { callId } = req.query;

        if (!callId) {
            return res.status(400).json({ message: 'Call ID is required' });
        }

        const meeting = await meetingModel.findOne({ callId })
            .select('participants updatedAt creatorId')
            .lean();

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        // Participants from registered users
        const participants = meeting.participants
            .filter((p) => p.status === "approved")
            .map((p) => ({
                userId: p.userId,
                name: p.name,
                email: p.email,
                isHost: p.isHost,
                type: p.type,
                status: p.status,
                isCreator: p.userId === meeting.creatorId,
            }));

        res.status(200).json({ participants, updatedAt: meeting.updatedAt });
    } catch (error) {
        console.error('Fetch participants error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

