'use client';

import React from 'react';
import { PasswordResetForm } from '@/components/admin/auth';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset Password
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email to receive reset instructions
        </p>
        <PasswordResetForm />
      </div>
    </div>
  );
}
