const express = require('express');

const {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} = require('../controllers/clientController');
const { protect } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');
const { requireRole } = require('../middleware/roleGuard');

const router = express.Router();

router.use(protect, tenantScope);

router.get('/', getAllClients);
router.get('/:id', getClientById);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', requireRole(['owner', 'manager']), deleteClient);

module.exports = router;
