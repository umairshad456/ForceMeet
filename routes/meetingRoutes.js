const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const protectRoute = require('../middlewares/authMiddleware');

router.get('/getScheduleMeetings', protectRoute, meetingController.getScheduleMeetings);
router.get('/getAllPreviousMeetings', protectRoute, meetingController.getAllPreviousMeetings);
router.get('/getAllUpcomingMeetings', protectRoute, meetingController.getAllUpcomingMeetings);
router.get('/getAllRecordedMeetings', protectRoute, meetingController.getAllRecordedMeetings);
router.get('/fetchParticipants', meetingController.fetchParticipants);
router.get('/getUserRolesandPermission/:callId/:userId', meetingController.getUserRolesandPermission);
router.get('/checkAprrovalStatus/:callId/:userId', meetingController.checkAprrovalStatus);
router.get('/getMeetingByCallId/:callId', meetingController.getMeetingByCallId);

// New route to get token for stream provider
router.get('/video/token/:userId', meetingController.getTokenForStreamProvider);
router.get('/chat/token/:userId', meetingController.getTokenForStreamChat);

router.post('/checkParticipantStatus', meetingController.checkParticipantStatus);
router.post('/joinRequest', meetingController.joinRequest);
router.post('/createMeeting', meetingController.createMeeting);
router.post('/sendInvite', protectRoute, meetingController.sendInvite);


module.exports = router;