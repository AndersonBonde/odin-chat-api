const { Router } = require('express');
const { getHashedGuestName } = require('../utils');

const router = new Router();

router.get('/', (req, res) => res.json({ message: 'Index page' }));
router.get('/connect', (req, res) => {
  try {
    const ipRaw = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ip = Array.isArray(ipRaw) ? ipRaw[0] : ipRaw?.split(',')[0].trim();
  
    const guestName = getHashedGuestName(ip);
  
    return res.status(200).json({ message: 'Guest name generated successfully', guestName });
  } catch (err) {
    console.error('Failed to generate guest name:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.use('/users', require('./users'));
router.use('/messages', require('./messages'));
router.use('/chat-rooms', require('./chat-rooms'));

module.exports = router;
