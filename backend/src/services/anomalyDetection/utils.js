function magnitude(v) {
  return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
}

function lowPassGravity(previous, sample, alpha = 0.1) {
  if (!previous) {
    return { ...sample };
  }
  return {
    x: previous.x + alpha * (sample.x - previous.x),
    y: previous.y + alpha * (sample.y - previous.y),
    z: previous.z + alpha * (sample.z - previous.z),
  };
}

function linearAcceleration(sample, gravity) {
  return {
    x: sample.x - gravity.x,
    y: sample.y - gravity.y,
    z: sample.z - gravity.z,
  };
}

function welford(values) {
  let mean = 0;
  let m2 = 0;
  let count = 0;

  values.forEach((value) => {
    count += 1;
    const delta = value - mean;
    mean += delta / count;
    const delta2 = value - mean;
    m2 += delta * delta2;
  });

  const variance = count > 1 ? m2 / (count - 1) : 0;
  return { count, mean, variance, std: Math.sqrt(variance) };
}

class SlidingWindowStore {
  constructor() {
    this.store = new Map();
  }

  push(deviceId, readings, windowMs) {
    const current = this.store.get(deviceId) || [];
    const all = current.concat(readings).sort((a, b) => new Date(a.ts) - new Date(b.ts));
    const newestTs = new Date(all[all.length - 1]?.ts || Date.now()).getTime();
    const filtered = all.filter((item) => newestTs - new Date(item.ts).getTime() <= windowMs);
    this.store.set(deviceId, filtered);
    return filtered;
  }
}

function computeSeverity(value, threshold) {
  const overshoot = Math.abs(value) / Math.abs(threshold);
  if (overshoot >= 2) return 'high';
  if (overshoot >= 1.5) return 'medium';
  return 'low';
}

module.exports = {
  magnitude,
  lowPassGravity,
  linearAcceleration,
  welford,
  SlidingWindowStore,
  computeSeverity,
};
