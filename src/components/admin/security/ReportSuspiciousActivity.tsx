'use client';

import React, { useState } from 'react';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface FormData {
  activityType: string;
  ip: string;
  username: string;
  description: string;
}

interface FormErrors {
  activityType?: string;
  description?: string;
}

export const ReportSuspiciousActivity: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    activityType: '',
    ip: '',
    username: '',
    description: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activityTypes = [
    { id: 'suspicious_login', label: 'Suspicious Login' },
    { id: 'unauthorized_access', label: 'Unauthorized Access' },
    { id: 'brute_force', label: 'Brute Force Attempt' },
    { id: 'account_compromise', label: 'Account Compromise' },
    { id: 'other', label: 'Other' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.activityType) {
      newErrors.activityType = 'Activity type is required';
    }
    
    if (!formData.description) {
      newErrors.description = 'Description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(null);
    
    try {
      const response = await fetch('/api/admin/security/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error submitting report: ${response.status}`);
      }
      
      setSubmitSuccess(true);
      
      // Reset form
      setFormData({
        activityType: '',
        ip: '',
        username: '',
        description: ''
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {submitSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
          <div>
            <p className="text-green-700 font-medium">Report submitted successfully</p>
            <p className="text-green-600 text-sm">Thank you for helping to keep the system secure.</p>
          </div>
        </div>
      )}
      
      {submitError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">Failed to submit report</p>
            <p className="text-red-600 text-sm">{submitError}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="activityType" className="block text-sm font-medium text-gray-700 mb-1">
            Activity Type
          </label>
          <select
            id="activityType"
            name="activityType"
            value={formData.activityType}
            onChange={handleChange}
            className={`block w-full rounded-md border ${
              errors.activityType ? 'border-red-300' : 'border-gray-300'
            } shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            aria-invalid={errors.activityType ? 'true' : 'false'}
          >
            <option value="">Select activity type</option>
            {activityTypes.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
          {errors.activityType && (
            <p className="mt-1 text-sm text-red-600">{errors.activityType}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="ip" className="block text-sm font-medium text-gray-700 mb-1">
            IP Address (optional)
          </label>
          <input
            type="text"
            id="ip"
            name="ip"
            value={formData.ip}
            onChange={handleChange}
            placeholder="e.g., 192.168.1.1"
            className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username (optional)
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="e.g., john.doe"
            className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Describe the suspicious activity in detail..."
            className={`block w-full rounded-md border ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            } shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            aria-invalid={errors.description ? 'true' : 'false'}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
};
