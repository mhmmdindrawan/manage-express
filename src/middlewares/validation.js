// ===== src/middlewares/validation.js =====
const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['superadmin', 'admin', 'staff', 'mitra', 'customer'])
    .withMessage('Invalid role specified'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

const validatePartner = [
  body('mitra_name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Partner name must be between 2 and 255 characters'),
  
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  
  body('contact')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Contact must not exceed 50 characters'),
  
  handleValidationErrors
];

const validateUUID = (field) => [
  param(field)
    .isUUID()
    .withMessage(`${field} must be a valid UUID`),
  
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validatePartner,
  validateUUID,
  handleValidationErrors
};
