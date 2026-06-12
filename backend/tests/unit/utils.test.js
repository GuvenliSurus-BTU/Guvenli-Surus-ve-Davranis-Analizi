const {
  magnitude,
  lowPassGravity,
  welford,
  computeSeverity,
  SlidingWindowStore,
} = require('../../src/services/anomalyDetection/utils');

describe('utils.magnitude', () => {
  test('matches sqrt(x^2 + y^2 + z^2)', () => {
    const v = { x: 3, y: 4, z: 12 };
    const expected = Math.sqrt(3 ** 2 + 4 ** 2 + 12 ** 2); // 13
    expect(magnitude(v)).toBeCloseTo(expected, 10);
    expect(magnitude({ x: 0, y: 0, z: 0 })).toBe(0);
    expect(magnitude({ x: 1, y: 1, z: 1 })).toBeCloseTo(Math.sqrt(3), 10);
  });
});

describe('utils.lowPassGravity', () => {
  test('after many iterations of a constant sample, output equals input', () => {
    const constant = { x: 0, y: 0, z: 9.81 };
    let state = null;
    for (let i = 0; i < 500; i += 1) {
      state = lowPassGravity(state, constant, 0.1);
    }
    expect(state.x).toBeCloseTo(constant.x, 6);
    expect(state.y).toBeCloseTo(constant.y, 6);
    expect(state.z).toBeCloseTo(constant.z, 6);
  });

  test('returns a copy of the first sample when previous is null', () => {
    const sample = { x: 1, y: 2, z: 3 };
    const out = lowPassGravity(null, sample);
    expect(out).toEqual(sample);
    expect(out).not.toBe(sample);
  });
});

describe('utils.welford', () => {
  // Wikipedia / Math.js reference sample. mean = 5, sum of squared deviations = 32.
  // Welford here returns the unbiased (sample, n-1) variance which is 32/7 ≈ 4.5714
  // — matching Math.js's default `variance()`.
  test('sample [2,4,4,4,5,5,7,9] → mean=5, sum sq-dev=32, sample variance=32/7', () => {
    const { mean, variance, count, std } = welford([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(count).toBe(8);
    expect(mean).toBeCloseTo(5, 10);
    expect(variance * (count - 1)).toBeCloseTo(32, 10);
    expect(variance).toBeCloseTo(32 / 7, 10);
    expect(std).toBeCloseTo(Math.sqrt(32 / 7), 10);
  });

  test('single value has zero variance', () => {
    const { mean, variance } = welford([7]);
    expect(mean).toBe(7);
    expect(variance).toBe(0);
  });
});

describe('utils.computeSeverity', () => {
  test('1.0x threshold → low', () => {
    expect(computeSeverity(3.0, 3.0)).toBe('low');
  });
  test('1.5x threshold → medium', () => {
    expect(computeSeverity(4.5, 3.0)).toBe('medium');
  });
  test('2.0x threshold → high', () => {
    expect(computeSeverity(6.0, 3.0)).toBe('high');
  });
  test('just below 1.5 stays low', () => {
    expect(computeSeverity(4.49, 3.0)).toBe('low');
  });
  test('just below 2.0 stays medium', () => {
    expect(computeSeverity(5.99, 3.0)).toBe('medium');
  });
});

describe('utils.SlidingWindowStore', () => {
  test('drops readings older than the window', () => {
    const store = new SlidingWindowStore();
    const t0 = 1_700_000_000_000;
    const old = [{ ts: new Date(t0).toISOString() }];
    store.push('dev', old, 1000);
    const fresh = [{ ts: new Date(t0 + 5000).toISOString() }];
    const out = store.push('dev', fresh, 1000);
    expect(out).toHaveLength(1);
  });
});
