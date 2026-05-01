const express = require('express');

const {
  getDashboardStats,
  getBookingReport,
  getEventReport,
  getAttendeeReport,
  getRevenueReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');

const router = express.Router();

router.use(protect, tenantScope);

router.get('/dashboard', getDashboardStats);
router.get('/bookings', getBookingReport);
router.get('/events', getEventReport);
router.get('/attendees', getAttendeeReport);
router.get('/revenue', getRevenueReport);

module.exports = router;
