const defaultThresholds = require('../../config/thresholds');
const detectSuddenBrake = require('./suddenBrake');
const detectSuddenAcceleration = require('./suddenAcceleration');
const detectSharpTurn = require('./sharpTurn');
const detectExcessiveJolt = require('./excessiveJolt');
const detectSpeeding = require('./speeding');
const { SlidingWindowStore } = require('./utils');

const slidingWindowStore = new SlidingWindowStore();
const cooldownMap = new Map();

function keyFor(deviceId, type) {
  return `${deviceId}:${type}`;
}

function inCooldown(deviceId, type, cooldownMs) {
  const key = keyFor(deviceId, type);
  const last = cooldownMap.get(key);
  if (!last) return false;
  return Date.now() - last < cooldownMs;
}

function setCooldown(deviceId, type) {
  cooldownMap.set(keyFor(deviceId, type), Date.now());
}

function mergeThresholds(override = {}) {
  return { ...defaultThresholds, ...override };
}

async function analyzeBatch({ deviceId, readings, thresholdOverride }) {
  const thresholds = mergeThresholds(thresholdOverride);
  const windowMs = thresholds.slidingWindowSec * 1000;
  const windowReadings = slidingWindowStore.push(deviceId.toString(), readings, windowMs);

  const speedingAlarms = await detectSpeeding(windowReadings, thresholds);

  const alarms = [
    ...detectSuddenBrake(windowReadings, thresholds),
    ...detectSuddenAcceleration(windowReadings, thresholds),
    ...detectSharpTurn(windowReadings, thresholds),
    ...detectExcessiveJolt(windowReadings, thresholds),
    ...speedingAlarms
  ].filter((alarm) => {
    if (inCooldown(deviceId, alarm.type, thresholds.eventCooldownMs)) return false;
    setCooldown(deviceId, alarm.type);
    return true;
  });

  return alarms;
}

module.exports = { analyzeBatch };
