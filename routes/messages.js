const { Router } = require('express');
const messagesController = require('../controllers/messagesController');

const router = new Router();

router.get('/chat-rooms/general', messagesController.getAllGeneralMessages);
router.post('/chat-rooms/general', messagesController.postMessageOnGeneral);
router.patch('/:id', messagesController.patchMessage);
router.delete('/:id', messagesController.deleteMessage);

module.exports = router;
