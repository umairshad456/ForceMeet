const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');


router.get('/pending-host-requests', notificationController.getPendingHostRequests);
router.post('/respond-host-request', notificationController.respondToHostRequests);
router.post('/send-host-request', notificationController.sendHostRequest);

router.get('/pending-participant-requests', notificationController.getPendingParticipantRequests);
router.post('/handle-participant-requests', notificationController.handleParticipantRequests);

module.exports = router;