const { Router } = require('express');
const messagesController = require('../controllers/messagesController');

const router = new Router();

router.get('/', messagesController.allGeneralMessagesGet);
router.post('/:id', messagesController.createMessagePost);

module.exports = router;
