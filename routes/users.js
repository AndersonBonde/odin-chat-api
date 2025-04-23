const { Router } = require('express');
const usersController = require('../controllers/usersController');

const router = new Router();

router.post('/register', usersController.registerUserPost);
router.post('/login', usersController.loginUserPost);
router.get('/logout', usersController.logoutUserGet);

module.exports = router;
