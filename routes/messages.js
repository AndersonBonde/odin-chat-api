const { Router } = require('express');
const messagesController = require('../controllers/messagesController');

const router = new Router();

router.get('/chat-rooms/general', messagesController.allGeneralMessagesGet);
router.post('/chat-rooms/:id', messagesController.createMessagePost);
router.patch('/:id', messagesController.updateMessagePatch);

module.exports = router;
