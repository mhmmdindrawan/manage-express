// ===== src/controllers/authController.js =====
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role,
      partner_id: user.partner_id
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (user.deleted_at) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated"
      });
    }

    // Patch untuk hash Laravel ($2y$ → $2a$)
    const fixedHash = user.password.replace(/^\$2y\$/, "$2a$");

    const isPasswordValid = await bcrypt.compare(password, fixedHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Rehash otomatis dengan bcrypt Node ($2b$)
    if (user.password.startsWith("$2y$")) {
      const newHash = await bcrypt.hash(password, 12);
      user.password = newHash;
      await user.save();
    }

    const token = generateToken(user);

    const userData = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      partner_id: user.partner_id,
      email_verified_at: user.email_verified_at,
    };

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: userData,
      },
    });
  } catch (error) {
    next(error);
  }
};

const debugUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: [
        'user_id',
        'username',
        'email',
        'role',
        'created_at',
        'deleted_at'
      ],
      limit: 20
    });

    res.json({
      success: true,
      message: 'Debug users data',
      data: {
        total: users.length,
        users: users.map(user => ({
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          is_deleted: !!user.deleted_at
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const user = req.user;
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token }
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available in development mode'
      });
    }

    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and newPassword are required'
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await user.update({ password: hashedPassword });

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        email: user.email,
        username: user.username,
        role: user.role,
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  getProfile,
  debugUsers,
  resetPassword
};
