const { computeSeverity } = require('./utils');

module.exports = function detectSuddenBrake(windowReadings, thresholds) {
  const hits = windowReadings.filter((r) => r.accel?.y <= thresholds.suddenBrakeAccelMs2);
  if (hits.length < thresholds.requiredSamplesAboveThreshold) return [];

  const minValue = Math.min(...hits.map((h) => h.accel.y));
  return [
    {
      type: 'sudden_brake',
      value: minValue,
      threshold: thresholds.suddenBrakeAccelMs2,
      unit: 'm/s2',
      severity: computeSeverity(minValue, thresholds.suddenBrakeAccelMs2),
      windowStart: new Date(windowReadings[0].ts),
      windowEnd: new Date(windowReadings[windowReadings.length - 1].ts),
      gps: hits[hits.length - 1].gps,
    },
  ];
};
