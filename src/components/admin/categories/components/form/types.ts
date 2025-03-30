import { Category } from '@/types';

/**
 * Data structure for the category form
 */
export interface CategoryFormData {
  name: string;
  slug: string;
  metaDescription: string;
  parentId: string;
  order: number;
}

/**
 * Props for the main CategoryForm component
 */
export interface CategoryFormProps {
  siteSlug: string;
  categoryId?: string;
  initialData?: Partial<Category>;
  onCancel?: () => void;
  onSaved?: (categoryId: string) => void;
}

/**
 * Validation errors for the form
 */
export interface ValidationErrors {
  name?: string;
  slug?: string;
  metaDescription?: string;
  parentId?: string;
  order?: string;
}

/**
 * Props for the form field components
 */
export interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  testId?: string;
}

/**
 * Props for the text input field
 */
export interface TextInputProps extends FormFieldProps {
  type?: 'text' | 'number' | 'email';
  pattern?: string;
  title?: string;
  min?: number;
  max?: number;
  helperText?: string;
}

/**
 * Props for the textarea field
 */
export interface TextAreaProps extends FormFieldProps {
  rows?: number;
  helperText?: string;
}

/**
 * Props for the select field
 */
export interface SelectFieldProps extends FormFieldProps {
  options: {
    value: string;
    label: string;
  }[];
  loading?: boolean;
  helperText?: string;
}

/**
 * Props for FormActions component
 */
export interface FormActionsProps {
  isLoading: boolean;
  isEditMode: boolean;
  onCancel: () => void;
}

/**
 * Props for StatusMessage component
 */
export interface StatusMessageProps {
  error: string | null;
  success: boolean;
  isEditMode: boolean;
}
