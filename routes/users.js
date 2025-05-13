const { Router } = require('express');
const usersController = require('../controllers/usersController');

const router = new Router();

router.post('/register', usersController.postRegisterUser);
router.post('/login', usersController.postLoginUser);
router.get('/logout', usersController.getLogoutUser);
router.get('/following/:id', usersController.getFollowingList);
router.patch('/profile/:id', usersController.patchUserProfile);

module.exports = router;
