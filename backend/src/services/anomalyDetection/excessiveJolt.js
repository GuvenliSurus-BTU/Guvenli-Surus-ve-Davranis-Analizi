const { computeSeverity, magnitude, welford } = require('./utils');

module.exports = function detectExcessiveJolt(windowReadings, thresholds) {
  const magnitudes = windowReadings.map((r) => Math.abs(magnitude(r.accel) - 9.81));
  const maxMag = Math.max(...magnitudes);
  const stats = welford(magnitudes);

  if (maxMag < thresholds.joltMagnitudeDeltaMs2 && stats.std < thresholds.joltWindowStdMs2) {
    return [];
  }

  return [
    {
      type: 'excessive_jolt',
      value: maxMag,
      threshold: thresholds.joltMagnitudeDeltaMs2,
      unit: 'm/s2',
      severity: computeSeverity(maxMag, thresholds.joltMagnitudeDeltaMs2),
      windowStart: new Date(windowReadings[0].ts),
      windowEnd: new Date(windowReadings[windowReadings.length - 1].ts),
      gps: windowReadings[windowReadings.length - 1].gps,
      evidence: { std: stats.std },
    },
  ];
};
