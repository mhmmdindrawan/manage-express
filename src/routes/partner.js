// routes/partner.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/partnerController');
const { authorizeRoles } = require('../middlewares/authMiddleware'); // Import authorizeRoles

// All routes are already protected by authenticateToken from index.js
router.get('/', authorizeRoles('admin', 'superadmin'), controller.getAllPartners);
router.get('/:id', authorizeRoles('admin', 'superadmin'), controller.getPartner);
router.post('/', authorizeRoles('admin', 'superadmin'), controller.createPartner);
router.put('/:id', authorizeRoles('admin', 'superadmin'), controller.updatePartner);
router.delete('/:id', authorizeRoles('admin', 'superadmin'), controller.deletePartner);

module.exports = router;