const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/profile', authController.getProfile);
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/logout', authController.logout);


module.exports = router;