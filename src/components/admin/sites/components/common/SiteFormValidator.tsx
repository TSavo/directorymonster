'use client';

import React, { useCallback, ReactNode } from 'react';
import { useSiteForm } from '@/components/admin/sites/context/SiteFormContext';

export interface SiteFormErrors {
  [key: string]: string;
}

export interface SiteFormValidatorProps {
  /**
   * Children to render
   */
  children: ReactNode;
  /**
   * Validation function that returns errors
   */
  onValidate: (formData: any) => SiteFormErrors;
  /**
   * Function to call when validation succeeds
   */
  onSuccess: () => void;
  /**
   * CSS class for the container
   */
  className?: string;
}

/**
 * SiteFormValidator - Handles form validation and navigation
 * 
 * Wraps form steps and handles validation when the user tries to proceed.
 */
export const SiteFormValidator: React.FC<SiteFormValidatorProps> = ({
  children,
  onValidate,
  onSuccess,
  className = ''
}) => {
  const { state, setErrors } = useSiteForm();
  const { formData } = state;
  
  // Handle validation and navigation
  const handleValidate = useCallback(() => {
    // Validate the form data
    const validationErrors = onValidate(formData);
    
    // Set errors in the form context
    setErrors(validationErrors);
    
    // If there are no errors, call the success callback
    if (Object.keys(validationErrors).length === 0) {
      onSuccess();
      return true;
    }
    
    return false;
  }, [formData, onValidate, setErrors, onSuccess]);
  
  // Clone children and inject the validation handler
  const childrenWithProps = React.Children.map(children, child => {
-  if (React.isValidElement(child) && child.type === 'button') {
+  if (
+    React.isValidElement(child) &&
+    (
+      child.type === 'button' ||
+      (typeof child.type === 'function' && child.props.type === 'button') ||
+      (child.props.role === 'button')
+    )
+  ) {
     // If it's a button, add the validation handler
     return React.cloneElement(child, {
       onClick: (e: React.MouseEvent) => {
         // Call the original onClick if it exists
         if (child.props.onClick) {
           child.props.onClick(e);
         }
         
         // Validate the form
         handleValidate();
       }
     });
   }
   return child;
  });
  
  return (
    <div className={className}>
      {childrenWithProps}
    </div>
  );
};

export default SiteFormValidator;
