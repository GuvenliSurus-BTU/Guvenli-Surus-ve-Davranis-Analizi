process.env.AUTH_MODE = 'jwt';
process.env.JWT_SECRET = 'test_secret_123';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/test_auth';

const jwt = require('jsonwebtoken');
const { requireAuth } = require('../../src/middleware/requireAuth');

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

describe('requireAuth jwt mode', () => {
  test('accepts a signed JWT and sets req.user', () => {
    const token = jwt.sign({ userId: '000000000000000000000002', role: 'driver' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockResponse();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ _id: '000000000000000000000002', role: 'driver' });
  });

  test('rejects an unsigned fake token', () => {
    const req = { headers: { authorization: 'Bearer fake.payload.token' } };
    const res = mockResponse();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
