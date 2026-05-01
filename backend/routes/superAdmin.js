const express = require('express');

const {
  getPlatformStats,
  getAllTenants,
  getTenantDetail,
  updateTenantStatus,
  updateTenantPlan,
  impersonateTenant,
  getAuditLog,
} = require('../controllers/superAdminController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

const router = express.Router();

router.use(protect, requireRole(['super_admin']));

router.get('/stats', getPlatformStats);
router.get('/tenants', getAllTenants);
router.get('/tenants/:id', getTenantDetail);
router.patch('/tenants/:id/status', updateTenantStatus);
router.patch('/tenants/:id/plan', updateTenantPlan);
router.post('/impersonate/:tenantId', impersonateTenant);
router.get('/audit', getAuditLog);

module.exports = router;
