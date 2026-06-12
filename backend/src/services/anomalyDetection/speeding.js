const { getSpeedLimit } = require('../speedLimitService');

/**
 * Detects if the vehicle is speeding based on GPS and road speed limits.
 * @param {Array} windowReadings - The recent GPS and sensor readings.
 * @param {Object} thresholds - Configuration thresholds.
 * @returns {Promise<Array>} List of generated alarms.
 */
async function detectSpeeding(windowReadings, thresholds) {
  const alarms = [];
  if (!windowReadings || windowReadings.length === 0) return alarms;

  // We only check the most recent reading in the window for speeding
  const latestReading = windowReadings[windowReadings.length - 1];
  
  if (!latestReading.gps || !latestReading.gps.lat || !latestReading.gps.lng) {
    return alarms;
  }

  const speedMs = latestReading.gps.speed;
  if (!speedMs || speedMs <= 0) return alarms;

  const currentSpeedKmH = speedMs * 3.6;

  // Optimize: don't call API if we are going very slow (e.g., < 20 km/h)
  if (currentSpeedKmH < 20) {
    return alarms;
  }

  try {
    const maxSpeedKmH = await getSpeedLimit(latestReading.gps.lat, latestReading.gps.lng);
    
    if (maxSpeedKmH) {
      // 10% + 3 km/h tolerance
      const tolerance = (maxSpeedKmH * 0.10) + 3;
      const allowedSpeed = maxSpeedKmH + tolerance;

      if (currentSpeedKmH > allowedSpeed) {
        alarms.push({
          type: 'SPEEDING',
          severity: 'HIGH',
          description: `Hız ihlali: Sınır ${maxSpeedKmH} km/h, Hızınız: ${Math.round(currentSpeedKmH)} km/h`,
          value: currentSpeedKmH,
          ts: latestReading.ts,
        });
      }
    }
  } catch (error) {
    console.error('Hız limiti kontrolü sırasında hata:', error);
  }

  return alarms;
}

module.exports = detectSpeeding;
