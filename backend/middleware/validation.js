const validator = require('validator');

const validateEmail = (req, res, next) => {
  const { email } = req.body;
  if (!validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }
  next();
};

const validatePassword = (req, res, next) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters'
    });
  }
  next();
};

const validatePhone = (req, res, next) => {
  const { phone } = req.body;
  if (!validator.isMobilePhone(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number'
    });
  }
  next();
};

module.exports = { validateEmail, validatePassword, validatePhone };
