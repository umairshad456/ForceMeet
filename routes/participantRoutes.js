const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');
const protectRoute = require('../middlewares/authMiddleware');

router.get('/fetchParticipants', protectRoute, participantController.fetchParticipants);

module.exports = router;