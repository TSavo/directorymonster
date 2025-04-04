/**
 * Email service for sending emails
 * This is a mock implementation for testing
 */

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const email = {
  /**
   * Send an email
   */
  sendEmail: async (options: EmailOptions): Promise<boolean> => {
    console.log(`[Email] Sending email to ${options.to} with subject: ${options.subject}`);
    // In a real implementation, this would send an actual email
    return true;
  },

  /**
   * Send a password reset email
   */
  sendPasswordResetEmail: async (to: string, resetToken: string): Promise<boolean> => {
    console.log(`[Email] Sending password reset email to ${to} with token: ${resetToken}`);
    // In a real implementation, this would send an actual email with a reset link
    return true;
  },
};

export default email;
