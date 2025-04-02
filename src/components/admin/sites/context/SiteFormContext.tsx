import React, { createContext, useContext, useState, useReducer, useCallback } from 'react';

// Define the form data interface
interface SiteFormData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  domains: string[];
  theme: string;
  customStyles: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  enableCanonicalUrls: boolean;
  [key: string]: any;
}

// Define the context state
interface SiteFormState {
  formData: SiteFormData;
  errors: Record<string, string>;
  isLoading: boolean;
  success: boolean;
  error: string | null;
  currentStep: string;
  completedSteps: string[];
}

// Define the context actions
interface SiteFormContextValue {
  state: SiteFormState;
  updateField: (name: string, value: any) => void;
  validateStep: (stepId: string) => boolean;
  submitForm: () => Promise<void>;
  goToStep: (stepId: string) => void;
  markStepComplete: (stepId: string) => void;
  resetErrors: () => void;
}

// Create the context
const SiteFormContext = createContext<SiteFormContextValue | undefined>(undefined);

// Define the initial state
const getInitialState = (initialData: Partial<SiteFormData> = {}): SiteFormState => ({
  formData: {
    id: initialData.id || '',
    name: initialData.name || '',
    slug: initialData.slug || '',
    description: initialData.description || '',
    domains: initialData.domains || [],
    theme: initialData.theme || 'default',
    customStyles: initialData.customStyles || '',
    seoTitle: initialData.seoTitle || '',
    seoDescription: initialData.seoDescription || '',
    seoKeywords: initialData.seoKeywords || '',
    enableCanonicalUrls: initialData.enableCanonicalUrls !== undefined ? initialData.enableCanonicalUrls : false
  },
  errors: {},
  isLoading: false,
  success: false,
  error: null,
  currentStep: 'basic_info',
  completedSteps: []
});

// Define action types
type SiteFormAction =
  | { type: 'UPDATE_FIELD'; name: string; value: any }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'RESET_ERRORS' }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_SUCCESS'; success: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_CURRENT_STEP'; stepId: string }
  | { type: 'MARK_STEP_COMPLETE'; stepId: string };

// Define the reducer
const siteFormReducer = (state: SiteFormState, action: SiteFormAction): SiteFormState => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.name]: action.value
        },
        // Clear error for this field when it's updated
        errors: {
          ...state.errors,
          [action.name]: undefined
        }
      };
    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.errors
      };
    case 'RESET_ERRORS':
      return {
        ...state,
        errors: {}
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading
      };
    case 'SET_SUCCESS':
      return {
        ...state,
        success: action.success
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error
      };
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.stepId
      };
    case 'MARK_STEP_COMPLETE':
      return {
        ...state,
        completedSteps: state.completedSteps.includes(action.stepId)
          ? state.completedSteps
          : [...state.completedSteps, action.stepId]
      };
    default:
      return state;
  }
};

// Create the provider component
export const SiteFormProvider: React.FC<{
  children: React.ReactNode;
  initialData?: Partial<SiteFormData>;
  mode?: 'create' | 'edit';
  apiEndpoint?: string;
  onSuccess?: (data: any) => void;
  initialStep?: string;
}> = ({
  children,
  initialData = {},
  mode = 'create',
  apiEndpoint = '/api/sites',
  onSuccess,
  initialStep
}) => {
  // Initialize state with reducer
  const [state, dispatch] = useReducer(
    siteFormReducer,
    getInitialState(initialData)
  );

  // Set initial step if provided
  React.useEffect(() => {
    if (initialStep) {
      dispatch({ type: 'SET_CURRENT_STEP', stepId: initialStep });
    }
  }, [initialStep]);

  // Update a field in the form
  const updateField = useCallback((name: string, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', name, value });
  }, []);

  // Reset form errors
  const resetErrors = useCallback(() => {
    dispatch({ type: 'RESET_ERRORS' });
  }, []);

  // Validate a specific step
  const validateStep = useCallback((stepId: string): boolean => {
    const errors: Record<string, string> = {};

    // Basic info step validation
    if (stepId === 'basic_info') {
      if (!state.formData.name) {
        errors.name = 'Name is required';
      } else if (state.formData.name.length > 50) {
        errors.name = 'Name cannot exceed 50 characters';
      }

      if (!state.formData.slug) {
        errors.slug = 'Slug is required';
      } else if (!/^[a-z0-9-]+$/.test(state.formData.slug)) {
        errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
      }

      if (state.formData.description && state.formData.description.length > 500) {
        errors.description = 'Description cannot exceed 500 characters';
      }
    }

    // Domains step validation
    if (stepId === 'domains') {
      if (state.formData.domains.length === 0) {
        errors.domains = 'At least one domain is required';
      }
    }

    // SEO step validation
    if (stepId === 'seo') {
      if (state.formData.seoTitle && state.formData.seoTitle.length > 60) {
        errors.seoTitle = 'SEO title should not exceed 60 characters';
      }

      if (state.formData.seoDescription && state.formData.seoDescription.length > 160) {
        errors.seoDescription = 'Meta description should not exceed 160 characters';
      }
    }

    // Set errors and return validation result
    dispatch({ type: 'SET_ERRORS', errors });
    return Object.keys(errors).length === 0;
  }, [state.formData]);

  // Submit the form
  const submitForm = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      dispatch({ type: 'SET_ERROR', error: null });

      const url = mode === 'edit' && state.formData.id
        ? `${apiEndpoint}/${state.formData.id}`
        : apiEndpoint;

      const response = await fetch(url, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(state.formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
      }

      dispatch({ type: 'SET_SUCCESS', success: true });

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, [apiEndpoint, mode, onSuccess, state.formData]);

  // Navigate to a specific step
  const goToStep = useCallback((stepId: string) => {
    // Only allow navigation to completed steps or the current step
    if (stepId === state.currentStep || state.completedSteps.includes(stepId)) {
      dispatch({ type: 'SET_CURRENT_STEP', stepId });
    }
  }, [state.currentStep, state.completedSteps]);

  // Mark a step as complete
  const markStepComplete = useCallback((stepId: string) => {
    dispatch({ type: 'MARK_STEP_COMPLETE', stepId });
  }, []);

  // Create context value
  const contextValue: SiteFormContextValue = {
    state: {
      ...state,
      validateStep // Add validateStep to state for easier access in test component
    },
    updateField,
    validateStep,
    submitForm,
    goToStep,
    markStepComplete,
    resetErrors
  };

  return (
    <SiteFormContext.Provider value={contextValue}>
      {children}
    </SiteFormContext.Provider>
  );
};

// Create a custom hook for using the context
export const useSiteForm = () => {
  const context = useContext(SiteFormContext);
  if (context === undefined) {
    throw new Error('useSiteForm must be used within a SiteFormProvider');
  }
  return context;
};
