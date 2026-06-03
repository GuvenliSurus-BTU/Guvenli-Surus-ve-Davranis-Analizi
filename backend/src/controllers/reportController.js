const asyncHandler = require('../utils/asyncHandler');
const reportService = require('../services/reportService');

const getTripReport = asyncHandler(async (req, res) => {
  const report = await reportService.tripReport(req.params.id);
  return res.json({ data: report });
});

const getDeviceDailyReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const report = await reportService.deviceDailyReport(req.params.id, from, to);
  return res.json({ data: report });
});

module.exports = { getTripReport, getDeviceDailyReport };
