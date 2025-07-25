//src/models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    field: 'user_id'
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  role: {
    type: DataTypes.ENUM('superadmin', 'admin', 'staff', 'mitra', 'customer', 'device'),
    allowNull: false,
    defaultValue: 'customer'
  },
  partner_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  email_verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: false, // Karena kita menggunakan field created_at/updated_at manual
  paranoid: false
});

// Instance methods
User.prototype.isAdmin = function() {
  return ['admin', 'superadmin'].includes(this.role);
};

User.prototype.isSuperAdmin = function() {
  return this.role === 'superadmin';
};

User.prototype.isPartner = function() {
  return this.role === 'mitra';
};

module.exports = User;