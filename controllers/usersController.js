const bcrypt = require('bcryptjs');
const prisma = require('../prisma/index');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const { issueJWT } = require('../utils');

const registerUserPost = [
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
    const { email, password } = req.body;

    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Error registering new user', errors: errors.array(), info: { email } });
    } 

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

const loginUserPost = [
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
    const { email, password } = req.body;

    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'There were validation errors', errors: errors.array(), info: { email } });
    }

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

const logoutUserGet = (req, res) => {
  return res.status(200).json({ message: 'Logout successful' });
}

module.exports = {
  registerUserPost,
  loginUserPost,
  logoutUserGet,
}
