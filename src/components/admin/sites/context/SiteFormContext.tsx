import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Define the shape of our form data
interface SiteFormData {
  name: string;
  slug: string;
  description: string;
  [key: string]: any;
}

// Define the shape of our form errors
interface SiteFormErrors {
  [key: string]: string;
}

// Define the shape of our form state
interface SiteFormState {
  formData: SiteFormData;
  errors: SiteFormErrors;
  isSubmitting: boolean;
  isValid: boolean;
}

// Define the actions we can dispatch
type SiteFormAction =
  | { type: 'UPDATE_FIELD'; field: string; value: any }
  | { type: 'SET_ERRORS'; errors: SiteFormErrors }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; errors: SiteFormErrors }
  | { type: 'RESET_FORM' };

// Define the context type
interface SiteFormContextType {
  state: SiteFormState;
  updateField: (field: string, value: any) => void;
  setErrors: (errors: SiteFormErrors) => void;
  submitForm: () => void;
  resetForm: () => void;
}

// Create the context
const SiteFormContext = createContext<SiteFormContextType | undefined>(undefined);

// Initial state
const initialState: SiteFormState = {
  formData: {
    name: '',
    slug: '',
    description: ''
  },
  errors: {},
  isSubmitting: false,
  isValid: false
};

// Reducer function
function siteFormReducer(state: SiteFormState, action: SiteFormAction): SiteFormState {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value
        }
      };
    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.errors,
        isValid: Object.keys(action.errors).length === 0
      };
    case 'SUBMIT_START':
      return {
        ...state,
        isSubmitting: true
      };
    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        isSubmitting: false,
        errors: {}
      };
    case 'SUBMIT_ERROR':
      return {
        ...state,
        isSubmitting: false,
        errors: action.errors,
        isValid: false
      };
    case 'RESET_FORM':
      return initialState;
    default:
      return state;
  }
}

// Provider component
interface SiteFormProviderProps {
  children: ReactNode;
  initialData?: Partial<SiteFormData>;
}

export const SiteFormProvider: React.FC<SiteFormProviderProps> = ({ 
  children, 
  initialData = {} 
}) => {
  const [state, dispatch] = useReducer(siteFormReducer, {
    ...initialState,
    formData: {
      ...initialState.formData,
      ...initialData
    }
  });

  const updateField = (field: string, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };

  const setErrors = (errors: SiteFormErrors) => {
    dispatch({ type: 'SET_ERRORS', errors });
  };

  const submitForm = () => {
    dispatch({ type: 'SUBMIT_START' });
    // Actual submission logic would go here
  };

  const resetForm = () => {
    dispatch({ type: 'RESET_FORM' });
  };

  return (
    <SiteFormContext.Provider value={{ state, updateField, setErrors, submitForm, resetForm }}>
      {children}
    </SiteFormContext.Provider>
  );
};

// Hook for using the context
export const useSiteForm = () => {
  const context = useContext(SiteFormContext);
  if (context === undefined) {
    throw new Error('useSiteForm must be used within a SiteFormProvider');
  }
  return context;
};

export default SiteFormProvider;
