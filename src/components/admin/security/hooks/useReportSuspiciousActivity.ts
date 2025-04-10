'use client';

import { useState, useCallback } from 'react';
import { SuspiciousActivityReport } from '../../../../types/security';
import { submitSuspiciousActivityReport } from '../../../../services/securityService';

export const useReportSuspiciousActivity = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submitReport = useCallback(async (data: SuspiciousActivityReport) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate the data
      if (!data.type) {
        throw new Error('Activity type is required');
      }

      if (!data.description) {
        throw new Error('Description is required');
      }

      // Submit the report to the API
      await submitSuspiciousActivityReport(data);

      // Set success state
      setSuccess(true);
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit report');
      setSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    submitReport,
    isSubmitting,
    error,
    success
  };
};

export default useReportSuspiciousActivity;
