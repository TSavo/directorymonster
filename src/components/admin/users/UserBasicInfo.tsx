'use client';

import React, { useState } from 'react';

interface UserBasicInfoProps {
  formData: {
    name: string;
    email: string;
    password: string;
  };
  errors: Record<string, string>;
  onChange: (name: string, value: any) => void;
  isExistingUser: boolean;
}

export function UserBasicInfo({
  formData,
  errors,
  onChange,
  isExistingUser
}: UserBasicInfoProps) {
  const [showPassword, setShowPassword] = useState(!isExistingUser);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange(name, value);
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium mb-4">Basic Information</h2>
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border ${errors.name ? 'border-red-500' : 'border-gray-300'} shadow-sm p-2`}
          data-testid="name-input"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600" data-testid="name-error">{errors.name}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-gray-300'} shadow-sm p-2`}
          data-testid="email-input"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600" data-testid="email-error">{errors.email}</p>
        )}
      </div>
      
      <div>
        <div className="flex justify-between items-center">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          {isExistingUser && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-indigo-600 hover:text-indigo-500"
              data-testid="toggle-password"
            >
              {showPassword ? 'Cancel' : 'Change Password'}
            </button>
          )}
        </div>
        {(showPassword || !isExistingUser) && (
          <>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${errors.password ? 'border-red-500' : 'border-gray-300'} shadow-sm p-2`}
              placeholder={isExistingUser ? 'Leave blank to keep current password' : ''}
              data-testid="password-input"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600" data-testid="password-error">{errors.password}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default UserBasicInfo;
