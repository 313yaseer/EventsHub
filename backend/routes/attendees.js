const express = require('express');
const rateLimit = require('express-rate-limit');

const {
  bulkCreateAttendees,
  getEventAttendees,
  getAttendeePass,
  scanQR,
  deleteEventAttendees,
} = require('../controllers/attendeeController');
const { protect } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');
const { checkUsageLimit } = require('../middleware/usageGuard');
const { requireRole } = require('../middleware/roleGuard');

const router = express.Router();

const scanRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/scan/:token', scanRateLimiter, scanQR);

router.use(protect, tenantScope);

router.post(
  '/events/:id/attendees/bulk',
  checkUsageLimit('attendee'),
  bulkCreateAttendees
);
router.get('/events/:id/attendees', getEventAttendees);
router.get('/attendees/:id/pass', getAttendeePass);
router.delete(
  '/events/:id/attendees',
  requireRole(['owner', 'manager']),
  deleteEventAttendees
);

module.exports = router;
