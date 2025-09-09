const router = require('express').Router();
const chatController = require('../controllers/chatController')


router.get('/getMessage/:callId', chatController.getMessages)
router.post('/sendMessage/:callId', chatController.sendMessage)


module.exports = router