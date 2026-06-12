const http = require('http');
const https = require('https');

// A simple in-memory cache to store speed limits for locations.
// In a real production system, this should use Redis or an LRU cache.
const speedLimitCache = new Map();

/**
 * Rounds a coordinate to 3 decimal places (approx 110m precision)
 * This helps cache hits for vehicles driving on the same road segment.
 */
function getCacheKey(lat, lng) {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

/**
 * Fetch speed limit from Overpass API
 * @param {number} lat 
 * @param {number} lng 
 * @returns {Promise<number|null>} Speed limit in km/h or null if unknown
 */
async function getSpeedLimit(lat, lng) {
  if (!lat || !lng) return null;

  const cacheKey = getCacheKey(lat, lng);
  if (speedLimitCache.has(cacheKey)) {
    return speedLimitCache.get(cacheKey);
  }

  const query = `[out:json];way(around:50,${lat},${lng})["maxspeed"];out tags;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.elements && json.elements.length > 0) {
            // Find the first way with a valid maxspeed
            for (const el of json.elements) {
              if (el.tags && el.tags.maxspeed) {
                // maxspeed can be "50", "50 km/h", "50 mph"
                let speedStr = el.tags.maxspeed.toLowerCase();
                let isMph = speedStr.includes('mph');
                let speedMatch = speedStr.match(/\d+/);
                
                if (speedMatch) {
                  let speed = parseInt(speedMatch[0], 10);
                  if (isMph) speed = Math.round(speed * 1.60934); // Convert mph to km/h
                  
                  // Cache and return
                  speedLimitCache.set(cacheKey, speed);
                  return resolve(speed);
                }
              }
            }
          }
          // No speed limit found, cache null so we don't spam the API
          speedLimitCache.set(cacheKey, null);
          resolve(null);
        } catch (e) {
          console.error('Error parsing Overpass response:', e.message);
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error('Error fetching speed limit:', err.message);
      resolve(null);
    });
  });
}

module.exports = {
  getSpeedLimit,
  getCacheKey
};
