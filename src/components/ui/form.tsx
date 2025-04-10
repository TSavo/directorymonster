import React from 'react';
import { cn } from '@/lib/utils';
import { 
  useForm, 
  UseFormReturn, 
  FieldValues, 
  UseFormProps, 
  FieldPath, 
  ControllerProps, 
  FieldError 
} from 'react-hook-form';

interface FormProps<TFieldValues extends FieldValues = FieldValues, TContext = any>
  extends React.FormHTMLAttributes<HTMLFormElement> {
  form?: UseFormReturn<TFieldValues, TContext>;
  onSubmit?: (data: TFieldValues) => void;
}

/**
 * Form component that integrates with react-hook-form
 */
export const Form = <TFieldValues extends FieldValues = FieldValues, TContext = any>({
  form,
  onSubmit,
  children,
  className,
  ...props
}: FormProps<TFieldValues, TContext>) => {
  return (
    <form
      className={cn('space-y-6', className)}
      onSubmit={form?.handleSubmit(onSubmit || (() => {}))}
      {...props}
    >
      {children}
    </form>
  );
};

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<ControllerProps<TFieldValues, TName>, 'render'> {
  render: (props: {
    field: {
      name: TName;
      value: any;
      onChange: (value: any) => void;
      onBlur: () => void;
      ref: React.RefObject<any>;
    };
  }) => React.ReactElement;
}

/**
 * FormField component for individual form fields
 */
export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ control, name, render }: FormFieldProps<TFieldValues, TName>) {
  // This is a simplified version for testing
  // In a real implementation, this would use react-hook-form's Controller
  return render({
    field: {
      name,
      value: '',
      onChange: () => {},
      onBlur: () => {},
      ref: React.createRef()
    }
  });
}

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * FormItem component for grouping form elements
 */
export function FormItem({ className, ...props }: FormItemProps) {
  return <div className={cn('space-y-2', className)} {...props} />;
}

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

/**
 * FormLabel component for form labels
 */
export function FormLabel({ className, ...props }: FormLabelProps) {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  );
}

interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * FormControl component for wrapping form controls
 */
export function FormControl({ className, ...props }: FormControlProps) {
  return <div className={cn('mt-2', className)} {...props} />;
}

interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * FormDescription component for form field descriptions
 */
export function FormDescription({ className, ...props }: FormDescriptionProps) {
  return (
    <p
      className={cn('text-sm text-neutral-500', className)}
      {...props}
    />
  );
}

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  error?: FieldError;
}

/**
 * FormMessage component for form error messages
 */
export function FormMessage({ className, error, children, ...props }: FormMessageProps) {
  const body = error ? error.message : children;

  if (!body) {
    return null;
  }

  return (
    <p
      className={cn('text-sm font-medium text-red-500', className)}
      {...props}
    >
      {body}
    </p>
  );
}

/**
 * Hook to create a form with default values
 */
export function useFormWithDefaults<TFieldValues extends FieldValues = FieldValues, TContext = any>(
  props?: UseFormProps<TFieldValues, TContext>
): UseFormReturn<TFieldValues, TContext> {
  return useForm<TFieldValues, TContext>(props);
}
