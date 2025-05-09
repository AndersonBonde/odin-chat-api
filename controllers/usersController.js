const bcrypt = require('bcryptjs');
const prisma = require('../prisma/index');
const passport = require('passport');
const { body, param, validationResult } = require('express-validator');
const { issueJWT } = require('../utils');

const postRegisterUser = [
  body('email')
    .trim()
    .normalizeEmail()
    .isEmail().withMessage('Please enter a valid email address')
    .bail()
    .custom(async(value) => {
      const user = await prisma.user.findUnique({
        where: { email: value }
      });

      if (user) {
        throw new Error('Email already in use');
      }
    }),
  body('password')
    .trim()
    .isLength({ min: 8 }).withMessage('Password minimum length is 8'),
  body('password_confirm')
    .trim()
    .custom((value, { req }) => {
      return req.body.password === value;
    }).withMessage(`Your password and password confirm value didn't match`),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Error registering new user', errors: errors.array(), info: { email } });
    } 

    const { email, password } = req.body;
    
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email: req.body.email,
          password: hashedPassword,
        }
      });
      
      const jwt = issueJWT(user);
      const { id, email } = user; 

      return res.status(201).json({ message: 'User created successfully', user: { id, email }, token: jwt.token, expiresIn: jwt.expires });
    } catch (err) {
      next(err);
    }
  }
];

const postLoginUser = [
  body('email')
    .trim()
    .normalizeEmail()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address'),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'There were validation errors', errors: errors.array(), info: { email } });
    }

    const { email, password } = req.body;
    
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });
  
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      const jwt = issueJWT(user);
      const { id } = user;
  
      return res.status(200).json({ message: 'User login was successful', user: { id, email }, token: jwt.token, expiresIn: jwt.expires });
    } catch (err) { 
      next(err) 
    }
  }
];

const getLogoutUser = (req, res) => {
  return res.status(200).json({ message: 'Logout successful' });
}

const getFollowingList = [
  passport.authenticate('jwt', { session: false }),
  param('id').isInt(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    if (id != req.user.id) {
      return res.status(403).json({ message: `Failed to fetch following list`});
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id, 10) },
        include: { 
          following: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return json.status(200).json(user.following);

    } catch (err) {
      next(err);
    }
  }
];

module.exports = {
  postRegisterUser,
  postLoginUser,
  getLogoutUser,
  getFollowingList,
}
