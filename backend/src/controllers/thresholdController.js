const asyncHandler = require('../utils/asyncHandler');
const thresholdService = require('../services/thresholdService');

const getThresholds = asyncHandler(async (req, res) => {
  const config = await thresholdService.getDeviceThresholds(req.params.id);
  return res.json({ data: config });
});

const putThresholds = asyncHandler(async (req, res) => {
  const config = await thresholdService.upsertDeviceThresholds(
    req.params.id,
    req.body.overrides,
    req.user._id,
  );
  return res.json({ data: config });
});

module.exports = { getThresholds, putThresholds };
