const { Router } = require('express');
const chatRoomsController = require('../controllers/chatRoomsController');

const router = new Router();

router.get('/general', chatRoomsController.getAllGeneralMessages);
router.post('/general', chatRoomsController.postMessageOnGeneral);

module.exports = router;
