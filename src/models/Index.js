// ===== src/models/Index.js =====
const sequelize = require('../config/database');
const User = require('./User');
const Partner = require('./Partner');
const Customer = require('./Customer');

// Define associations
User.hasOne(Partner, { 
  foreignKey: 'user_id', 
  sourceKey: 'user_id',
  as: 'partner'
});

Partner.belongsTo(User, { 
  foreignKey: 'user_id', 
  targetKey: 'user_id',
  as: 'user'
});

User.hasOne(Customer, { 
  foreignKey: 'user_id', 
  sourceKey: 'user_id',
  as: 'customer'
});

Customer.belongsTo(User, { 
  foreignKey: 'user_id', 
  targetKey: 'user_id',
  as: 'user'
});

// Many users can belong to one partner (for staff)
User.belongsTo(Partner, { 
  foreignKey: 'partner_id', 
  targetKey: 'partner_id',
  as: 'partnerOrganization'
});

Partner.hasMany(User, { 
  foreignKey: 'partner_id', 
  sourceKey: 'partner_id',
  as: 'users'
});

module.exports = {
  sequelize,
  User,
  Partner,
  Customer
};