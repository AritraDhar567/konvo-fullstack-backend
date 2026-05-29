const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  validateSignup,
  validateLogin,
  validateOTP,
  validateVerifyOTP,
} = require('../middleware/validation');

// Signup
router.post('/signup', validateSignup, authController.signup);

// Login
router.post('/login', validateLogin, authController.login);

// Request OTP
router.post('/request-otp', validateOTP, authController.requestOTP);

// Verify OTP
router.post('/verify-otp', validateVerifyOTP, authController.verifyOTP);

module.exports = router;
