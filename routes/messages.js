const { Router } = require('express');
const messagesController = require('../controllers/messagesController');

const router = new Router();

router.patch('/:id', messagesController.patchMessage);
router.delete('/:id', messagesController.deleteMessage);

module.exports = router;
