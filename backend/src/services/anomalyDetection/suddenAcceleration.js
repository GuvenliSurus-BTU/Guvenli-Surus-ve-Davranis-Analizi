const { computeSeverity } = require('./utils');

module.exports = function detectSuddenAcceleration(windowReadings, thresholds) {
  const hits = windowReadings.filter((r) => r.accel?.y >= thresholds.suddenAccelerationMs2);
  if (hits.length < thresholds.requiredSamplesAboveThreshold) return [];

  const maxValue = Math.max(...hits.map((h) => h.accel.y));
  return [
    {
      type: 'sudden_acceleration',
      value: maxValue,
      threshold: thresholds.suddenAccelerationMs2,
      unit: 'm/s2',
      severity: computeSeverity(maxValue, thresholds.suddenAccelerationMs2),
      windowStart: new Date(windowReadings[0].ts),
      windowEnd: new Date(windowReadings[windowReadings.length - 1].ts),
      gps: hits[hits.length - 1].gps,
    },
  ];
};
