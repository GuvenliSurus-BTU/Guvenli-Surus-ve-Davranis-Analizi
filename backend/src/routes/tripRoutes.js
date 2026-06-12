const express = require('express');
const { startTrip, endTrip, listTrips, getTripById } = require('../controllers/tripController');
const { requireAuth } = require('../middleware/requireAuth');
const validate = require('../middleware/validate');
const { tripStartSchema } = require('../validators/tripSchema');

const router = express.Router();

router.post('/start', requireAuth, validate(tripStartSchema), startTrip);
router.post('/:id/end', requireAuth, endTrip);
router.get('/', requireAuth, listTrips);
router.get('/:id', requireAuth, getTripById);

module.exports = router;
