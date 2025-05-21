const { Router } = require('express');
const chatRoomsController = require('../controllers/chatRoomsController');

const router = new Router();

router.get('/general', chatRoomsController.getAllGeneralMessages);
router.post('/general', chatRoomsController.postMessageOnGeneral);
router.post('/', chatRoomsController.createChatRoom);
router.get('/:id', chatRoomsController.getChatRoomMessages);
router.post('/:id', chatRoomsController.postChatRoomMessage);

module.exports = router;
