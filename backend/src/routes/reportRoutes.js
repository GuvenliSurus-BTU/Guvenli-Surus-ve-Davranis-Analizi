const express = require('express');
const { getTripReport, getDeviceDailyReport } = require('../controllers/reportController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

/**
 * @openapi
 * /api/v1/reports/trip/{id}:
 *   get:
 *     summary: Get aggregated alarm report for a trip
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip alarm summary including counts by type and most-severe alarm
 */
router.get('/trip/:id', requireAuth, getTripReport);

/**
 * @openapi
 * /api/v1/reports/device/{id}/daily:
 *   get:
 *     summary: Daily alarm density per type for a device
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Daily anomaly density buckets grouped by day and type
 */
router.get('/device/:id/daily', requireAuth, getDeviceDailyReport);

module.exports = router;
