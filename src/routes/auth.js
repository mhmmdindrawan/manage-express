// ===== src/routes/auth.js (UPDATED WITH DEBUG ENDPOINT) =====
const express = require('express');
const router = express.Router();
const { login, refreshToken, logout, getProfile, debugUsers, resetPassword } = require('../controllers/authController');
const { validateLogin } = require('../middlewares/validation');
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');

// Public routes
router.post('/login', validateLogin, login);

// Debug endpoint (only in development)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug-users', debugUsers);
  router.post('/reset-password', resetPassword);
}

// Protected routes
router.post('/refresh', authenticateToken, refreshToken);
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);

// Admin only test route
router.get('/admin-test', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Admin access granted!',
    user: {
      id: req.user.user_id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;