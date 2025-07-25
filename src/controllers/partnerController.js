// ===== src/controllers/partnerController.js =====
const { Partner, User } = require('../models/Index.js');
const { Op } = require('sequelize');

const getAllPartners = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};
    
    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { mitra_name: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
        { contact: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Status filter
    if (status) {
      whereClause.status = status;
    }
    
    const { rows: partners, count } = await Partner.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['user_id', 'username', 'email', 'role']
      }],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        partners,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
};

const getPartner = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const partner = await Partner.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['user_id', 'username', 'email', 'role']
      }]
    });
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }
    
    res.json({
      success: true,
      data: { partner }
    });
    
  } catch (error) {
    next(error);
  }
};

const createPartner = async (req, res, next) => {
  try {
    const { user_id, mitra_name, address, contact, status = 'pending' } = req.body;
    
    // Check if user exists and doesn't already have a partner
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const existingPartner = await Partner.findOne({ where: { user_id } });
    if (existingPartner) {
      return res.status(409).json({
        success: false,
        message: 'User already has a partner account'
      });
    }
    
    const partner = await Partner.create({
      user_id,
      mitra_name,
      address,
      contact,
      status
    });
    
    // Update user role to mitra and set partner_id
    await user.update({ 
      role: 'mitra',
      partner_id: partner.partner_id
    });
    
    res.status(201).json({
      success: true,
      message: 'Partner created successfully',
      data: { partner }
    });
    
  } catch (error) {
    next(error);
  }
};

const updatePartner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const partner = await Partner.findByPk(id);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }
    
    await partner.update(updateData);
    
    res.json({
      success: true,
      message: 'Partner updated successfully',
      data: { partner }
    });
    
  } catch (error) {
    next(error);
  }
};

const deletePartner = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const partner = await Partner.findByPk(id);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }
    
    // Soft delete
    await partner.destroy();
    
    // Update user role back to customer
    await User.update(
      { role: 'customer', partner_id: null },
      { where: { user_id: partner.user_id } }
    );
    
    res.json({
      success: true,
      message: 'Partner deleted successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPartners,
  getPartner,
  createPartner,
  updatePartner,
  deletePartner
};
