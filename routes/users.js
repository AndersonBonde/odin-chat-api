const { Router } = require('express');
const usersController = require('../controllers/usersController');

const router = new Router();

router.post('/register', usersController.postRegisterUser);
router.post('/login', usersController.postLoginUser);
router.get('/logout', usersController.getLogoutUser);
router.get('/following/:id', usersController.getFollowingList);
router.post('/following/:id', usersController.postFollowing);
router.delete('/following/:id', usersController.deleteFollowing);
router.patch('/profile/:id', usersController.patchUserProfile);
router.get('/me', usersController.getMyInfo);
router.get('/chat-rooms', usersController.getMyChatRooms);

module.exports = router;
