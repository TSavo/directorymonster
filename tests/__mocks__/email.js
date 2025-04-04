/**
 * Email Service Mock for Tests
 */

const emailMock = {
  /**
   * Send an email
   */
  sendEmail: jest.fn(async (options) => {
    console.log(`[Mock Email] Sending email to ${options.to} with subject: ${options.subject}`);
    return true;
  }),

  /**
   * Send a password reset email
   */
  sendPasswordResetEmail: jest.fn(async (to, resetToken) => {
    console.log(`[Mock Email] Sending password reset email to ${to} with token: ${resetToken}`);
    return true;
  }),

  /**
   * Helper to reset the mock state
   */
  __resetMock: () => {
    Object.values(emailMock).forEach(fn => {
      if (typeof fn === 'function' && fn.mockClear) {
        fn.mockClear();
      }
    });
  }
};

module.exports = emailMock;
