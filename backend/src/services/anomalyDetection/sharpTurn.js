const { computeSeverity } = require('./utils');

module.exports = function detectSharpTurn(windowReadings, thresholds) {
  const hits = windowReadings.filter((r) => {
    const yaw = Math.abs(r.gyro?.z || 0);
    const lateral = Math.abs(r.accel?.x || 0);
    const speed = r.gps?.speed ?? r.speed;
    const hasSpeed = typeof speed === 'number';
    const overRotation = yaw >= thresholds.sharpTurnYawRadS;
    const overLateral = lateral >= thresholds.sharpTurnLateralMs2;

    return (overRotation || overLateral) && (!hasSpeed || speed >= thresholds.minTurnSpeedMs);
  });

  if (hits.length < thresholds.requiredSamplesAboveThreshold) return [];

  const maxYaw = Math.max(...hits.map((h) => Math.abs(h.gyro?.z || 0)));
  const maxLateral = Math.max(...hits.map((h) => Math.abs(h.accel?.x || 0)));
  const usesYaw = maxYaw >= thresholds.sharpTurnYawRadS;
  const value = usesYaw ? maxYaw : maxLateral;
  const threshold = usesYaw ? thresholds.sharpTurnYawRadS : thresholds.sharpTurnLateralMs2;

  return [
    {
      type: 'sharp_turn',
      value,
      threshold,
      unit: usesYaw ? 'rad/s' : 'm/s2',
      severity: computeSeverity(value, threshold),
      windowStart: new Date(windowReadings[0].ts),
      windowEnd: new Date(windowReadings[windowReadings.length - 1].ts),
      gps: hits[hits.length - 1].gps,
    },
  ];
};
