const requestIdMiddleware = require('../src/middleware/requestId');

describe('Request ID Middleware', () => {
  test('should generate and attach request ID to request', () => {
    const req = {};
    const res = {
      setHeader: jest.fn()
    };
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(req.requestId).toBeTruthy();
    expect(typeof req.requestId).toBe('string');
    expect(req.requestId).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', req.requestId);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('should generate unique request IDs for different requests', () => {
    const req1 = {};
    const req2 = {};
    const res1 = { setHeader: jest.fn() };
    const res2 = { setHeader: jest.fn() };
    const next = jest.fn();

    requestIdMiddleware(req1, res1, next);
    requestIdMiddleware(req2, res2, next);

    expect(req1.requestId).not.toBe(req2.requestId);
  });
});
