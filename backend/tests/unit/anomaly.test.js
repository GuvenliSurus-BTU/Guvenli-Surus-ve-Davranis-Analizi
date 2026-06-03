const detectSuddenBrake = require('../../src/services/anomalyDetection/suddenBrake');
const detectSuddenAcceleration = require('../../src/services/anomalyDetection/suddenAcceleration');
const detectSharpTurn = require('../../src/services/anomalyDetection/sharpTurn');
const detectExcessiveJolt = require('../../src/services/anomalyDetection/excessiveJolt');
const defaults = require('../../src/config/thresholds');

function reading(base = {}) {
  return {
    ts: new Date().toISOString(),
    accel: { x: 0.1, y: 0.1, z: 9.8, ...(base.accel || {}) },
    gyro: { x: 0.1, y: 0.1, z: 0.1, ...(base.gyro || {}) },
    gps: { lat: 40, lng: 29, speed: 12, accuracy: 5, ...(base.gps || {}) },
    ...base,
  };
}

describe('anomaly detectors — positive cases', () => {
  test('detects sudden brake when window has enough samples below threshold', () => {
    const window = Array.from({ length: 12 }, () => reading({ accel: { y: -4.0 } }));
    const alarms = detectSuddenBrake(window, defaults);
    expect(alarms).toHaveLength(1);
    expect(alarms[0].type).toBe('sudden_brake');
    expect(alarms[0].value).toBeLessThanOrEqual(defaults.suddenBrakeAccelMs2);
  });

  test('detects sudden acceleration when window has enough samples above threshold', () => {
    const window = Array.from({ length: 12 }, () => reading({ accel: { y: 3.8 } }));
    const alarms = detectSuddenAcceleration(window, defaults);
    expect(alarms).toHaveLength(1);
    expect(alarms[0].type).toBe('sudden_acceleration');
    expect(alarms[0].value).toBeGreaterThanOrEqual(defaults.suddenAccelerationMs2);
  });

  test('detects sharp turn with yaw + speed', () => {
    const window = Array.from({ length: 12 }, () =>
      reading({ gyro: { z: 1.8 }, accel: { x: 4.3 } }),
    );
    const alarms = detectSharpTurn(window, defaults);
    expect(alarms).toHaveLength(1);
    expect(alarms[0].type).toBe('sharp_turn');
  });

  test('detects sharp turn with lateral acceleration when speed is missing', () => {
    const window = Array.from({ length: 12 }, () =>
      reading({ gyro: { z: 0.1 }, accel: { x: 4.5 }, gps: undefined, speed: undefined }),
    );
    const alarms = detectSharpTurn(window, defaults);
    expect(alarms).toHaveLength(1);
    expect(alarms[0].type).toBe('sharp_turn');
    expect(alarms[0].unit).toBe('m/s2');
  });

  test('detects sharp turn with lateral acceleration value when yaw is low', () => {
    const window = Array.from({ length: 12 }, () =>
      reading({ gyro: { z: 0.1 }, accel: { x: 4.5 }, gps: { speed: 12 } }),
    );
    const alarms = detectSharpTurn(window, defaults);
    expect(alarms).toHaveLength(1);
    expect(alarms[0].value).toBeGreaterThanOrEqual(defaults.sharpTurnLateralMs2);
    expect(alarms[0].threshold).toBe(defaults.sharpTurnLateralMs2);
  });

  test('detects excessive jolt with single high-magnitude sample', () => {
    const window = [reading({ accel: { x: 10.5, y: 0, z: 16.0 } })];
    const alarms = detectExcessiveJolt(window, defaults);
    expect(alarms).toHaveLength(1);
    expect(alarms[0].type).toBe('excessive_jolt');
  });
});

describe('anomaly detectors — negative cases', () => {
  test('no sudden_brake when below required-sample count', () => {
    const window = [
      ...Array.from({ length: 4 }, () => reading({ accel: { y: -4.0 } })),
      ...Array.from({ length: 20 }, () => reading()),
    ];
    expect(detectSuddenBrake(window, defaults)).toHaveLength(0);
  });

  test('no sudden_brake when readings sit just above the threshold', () => {
    const window = Array.from({ length: 30 }, () => reading({ accel: { y: -3.0 } }));
    expect(detectSuddenBrake(window, defaults)).toHaveLength(0);
  });

  test('no sudden_acceleration when below threshold', () => {
    const window = Array.from({ length: 30 }, () => reading({ accel: { y: 2.0 } }));
    expect(detectSuddenAcceleration(window, defaults)).toHaveLength(0);
  });

  test('no sharp_turn when below speed gate', () => {
    const window = Array.from({ length: 30 }, () =>
      reading({ gyro: { z: 1.8 }, gps: { speed: 1 } }),
    );
    expect(detectSharpTurn(window, defaults)).toHaveLength(0);
  });

  test('no sharp_turn when yaw and lateral are both under thresholds', () => {
    const window = Array.from({ length: 30 }, () =>
      reading({ gyro: { z: 0.4 }, accel: { x: 1.0 }, gps: { speed: 16 } }),
    );
    expect(detectSharpTurn(window, defaults)).toHaveLength(0);
  });

  test('no excessive_jolt for calm window', () => {
    const window = Array.from({ length: 30 }, () => reading());
    expect(detectExcessiveJolt(window, defaults)).toHaveLength(0);
  });
});

describe('anomaly orchestrator', () => {
  const { analyzeBatch } = require('../../src/services/anomalyDetection');

  function makeReadings(deviceId, count, mutate) {
    const start = Date.now();
    return Array.from({ length: count }, (_, i) => {
      const r = reading({});
      r.ts = new Date(start + i * 20).toISOString();
      if (mutate) mutate(r, i);
      return r;
    });
  }

  test('cooldown suppresses a repeated alarm of the same type', () => {
    const deviceId = 'device-cooldown-1';
    const r1 = makeReadings(deviceId, 30, (r) => {
      r.accel.y = -4.0;
    });
    const first = analyzeBatch({ deviceId, readings: r1 });
    expect(first.some((a) => a.type === 'sudden_brake')).toBe(true);

    const r2 = makeReadings(deviceId, 30, (r) => {
      r.accel.y = -4.0;
    });
    const second = analyzeBatch({ deviceId, readings: r2 });
    expect(second.some((a) => a.type === 'sudden_brake')).toBe(false);
  });

  test('threshold override changes detection outcome', () => {
    const deviceId = 'device-override-1';
    const calm = makeReadings(deviceId, 30, (r) => {
      r.accel.y = -2.0;
    });

    expect(analyzeBatch({ deviceId, readings: calm })).toHaveLength(0);

    const deviceId2 = 'device-override-2';
    const sameCalm = makeReadings(deviceId2, 30, (r) => {
      r.accel.y = -2.0;
    });
    const withOverride = analyzeBatch({
      deviceId: deviceId2,
      readings: sameCalm,
      thresholdOverride: { suddenBrakeAccelMs2: -1.5 },
    });
    expect(withOverride.some((a) => a.type === 'sudden_brake')).toBe(true);
  });
});
