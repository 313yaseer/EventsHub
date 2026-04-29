const express = require('express');

const {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  toggleActive,
  updatePayment,
  deleteBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');
const { checkUsageLimit } = require('../middleware/usageGuard');
const { requireRole } = require('../middleware/roleGuard');

const router = express.Router();

router.use(protect, tenantScope);

router.get('/', getAllBookings);
router.get('/:id', getBookingById);
router.post('/', checkUsageLimit('booking'), createBooking);
router.put('/:id', updateBooking);
router.patch('/:id/status', requireRole(['owner', 'manager']), updateBookingStatus);
router.patch('/:id/toggle', toggleActive);
router.patch('/:id/payment', requireRole(['owner', 'manager']), updatePayment);
router.delete('/:id', requireRole(['owner']), deleteBooking);

module.exports = router;
