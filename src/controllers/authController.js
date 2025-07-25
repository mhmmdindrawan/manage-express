// ===== src/controllers/authController.js (WITH DEBUGGING) =====
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
    
    console.log('🔍 LOGIN DEBUG - Input received:');
    console.log('  Email:', email);
    console.log('  Password length:', password ? password.length : 'undefined');
    console.log('  Password (first 3 chars):', password ? password.substring(0, 3) + '...' : 'undefined');
    
    // Find user by email
    const user = await User.findOne({ 
      where: { email: email.toLowerCase() } // Make sure email comparison is case insensitive
    });
    
    console.log('🔍 USER QUERY RESULT:');
    if (!user) {
      console.log('  ❌ User NOT FOUND for email:', email);
      
      // Let's try to find all users to see what's in the database
      const allUsers = await User.findAll({
        attributes: ['user_id', 'username', 'email', 'role'],
        limit: 10
      });
      console.log('  📋 Available users in database:');
      allUsers.forEach((u, index) => {
        console.log(`    ${index + 1}. ${u.email} (${u.username}) - ${u.role}`);
      });
      
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials',
        debug: process.env.NODE_ENV === 'development' ? 'User not found' : undefined
      });
    }
    
    console.log('  ✅ User FOUND:');
    console.log('    ID:', user.user_id);
    console.log('    Username:', user.username);
    console.log('    Email:', user.email);
    console.log('    Role:', user.role);
    console.log('    Password hash (first 10 chars):', user.password ? user.password.substring(0, 10) + '...' : 'undefined');
    console.log('    Deleted at:', user.deleted_at);
    
    // Check if user is soft deleted
    if (user.deleted_at) {
      console.log('  ❌ User is SOFT DELETED');
      return res.status(401).json({ 
        success: false,
        message: 'Account has been deactivated',
        debug: process.env.NODE_ENV === 'development' ? 'User soft deleted' : undefined
      });
    }
    
    // Debug password comparison
    console.log('🔍 PASSWORD VERIFICATION:');
    console.log('  Input password:', password);
    console.log('  Stored hash:', user.password);
    console.log('  Hash starts with $2y$:', user.password ? user.password.startsWith('$2y$') : false);
    
    // Verify password - Laravel menggunakan bcrypt dengan format $2y$
    // Node.js bcrypt bisa membaca format $2y$ dari Laravel
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log('  🔐 Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('  ❌ PASSWORD MISMATCH');
      
      // Let's try some common passwords for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('  🧪 Testing common passwords:');
        const testPasswords = ['password', 'admin', 'superadmin', '123456', 'password123'];
        for (const testPass of testPasswords) {
          const testResult = await bcrypt.compare(testPass, user.password);
          console.log(`    "${testPass}": ${testResult}`);
          if (testResult) {
            console.log(`    ✅ FOUND WORKING PASSWORD: "${testPass}"`);
            break;
          }
        }
      }
      
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials',
        debug: process.env.NODE_ENV === 'development' ? 'Password mismatch' : undefined
      });
    }
    
    console.log('  ✅ Password VALID');
    
    // Check if user is admin or superadmin
    console.log('🔍 ROLE CHECK:');
    console.log('  User role:', user.role);
    console.log('  Is admin/superadmin:', ['admin', 'superadmin'].includes(user.role));
    
    if (!['admin', 'superadmin'].includes(user.role)) {
      console.log('  ❌ INSUFFICIENT ROLE');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin access required.',
        debug: process.env.NODE_ENV === 'development' ? `Role '${user.role}' not allowed` : undefined
      });
    }
    
    console.log('  ✅ Role AUTHORIZED');
    
    // Generate token
    const token = generateToken(user);
    
    // Prepare user data (exclude sensitive info)
    const userData = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      partner_id: user.partner_id,
      email_verified_at: user.email_verified_at
    };
    
    console.log('🎉 LOGIN SUCCESSFUL for user:', userData.username);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userData
      }
    });
    
  } catch (error) {
    console.error('💥 LOGIN ERROR:', error);
    console.error('Stack trace:', error.stack);
    next(error);
  }
};

// Test endpoint to check database connection and users
const debugUsers = async (req, res, next) => {
  try {
    console.log('🔍 DEBUG USERS ENDPOINT CALLED');
    
    // Test database connection
    const User = require('../models/User');
    
    // Get all users
    const users = await User.findAll({
      attributes: ['user_id', 'username', 'email', 'role', 'created_at', 'deleted_at'],
      limit: 20
    });
    
    console.log('📋 All users in database:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.username}) - Role: ${user.role} - Deleted: ${user.deleted_at ? 'Yes' : 'No'}`);
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
    console.error('💥 DEBUG USERS ERROR:', error);
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const user = req.user; // From authenticateToken middleware
    
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
  // Since we're using JWT, logout is handled client-side
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

// Reset password endpoint (development only)
const resetPassword = async (req, res, next) => {
  try {
    // Only allow in development
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
    
    // Find user
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await user.update({ password: hashedPassword });
    
    console.log(`🔧 Password reset for ${email} to "${newPassword}"`);
    
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
    console.error('Reset password error:', error);
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