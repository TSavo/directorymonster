/**
 * Manual mock for jsonwebtoken
 */

module.exports = {
  verify: jest.fn().mockReturnValue({
    userId: 'user-123',
    exp: Math.floor(Date.now() / 1000) + 3600
  }),
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  decode: jest.fn().mockReturnValue({
    userId: 'user-123',
    exp: Math.floor(Date.now() / 1000) + 3600
  })
};
