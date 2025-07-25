// ===== src/models/Partner.js =====
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Partner = sequelize.define('Partner', {
  partner_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'partner_id'
  },
  partner_owner_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  mitra_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [2, 255],
      notEmpty: true
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  contact: {
    type: DataTypes.STRING(50),
    defaultValue: '0',
    validate: {
      len: [1, 50]
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'partners',
  timestamps: true,
  paranoid: true,
  hooks: {
    beforeCreate: (partner) => {
      if (!partner.partner_id) {
        partner.partner_id = DataTypes.UUIDV4;
      }
    }
  }
});

module.exports = Partner;