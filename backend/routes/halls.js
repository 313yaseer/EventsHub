const express = require('express');

const {
  getHalls,
  getHallById,
  createHall,
  updateHall,
  toggleHallAvailability,
  deleteHall,
} = require('../controllers/hallController');
const { protect } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');
const { checkUsageLimit } = require('../middleware/usageGuard');
const { requireRole } = require('../middleware/roleGuard');

const router = express.Router();

router.use(protect, tenantScope);

router.get('/', getHalls);
router.get('/:id', getHallById);
router.post('/', checkUsageLimit('hall'), createHall);
router.put('/:id', updateHall);
router.patch('/:id/toggle', toggleHallAvailability);
router.delete('/:id', requireRole(['owner', 'manager']), deleteHall);

module.exports = router;
