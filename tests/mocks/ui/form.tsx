import React from 'react';

// Create a context to share form field IDs
const FormContext = React.createContext<{ fieldId: string | null }>({ fieldId: null });

export const Form = ({ children, ...props }: any) => {
  // Filter out react-hook-form props that shouldn't be passed to DOM elements
  const { handleSubmit, formState, setValue, getValues, register, reset, watch, control, ...domProps } = props;

  return (
    <form data-testid="form" {...domProps}>{children}</form>
  );
};

export const FormField = ({ control, name, render }: any) => {
  // Generate a unique ID for the field
  const fieldId = `field-${name}`;

  return (
    <FormContext.Provider value={{ fieldId }}>
      {render({ field: { name, id: fieldId, value: '', onChange: jest.fn() } })}
    </FormContext.Provider>
  );
};

export const FormItem = ({ children }: any) => (
  <div data-testid="form-item">{children}</div>
);

export const FormLabel = ({ children }: any) => {
  // Get the field ID from context
  const { fieldId } = React.useContext(FormContext);

  return (
    <label data-testid="form-label" htmlFor={fieldId}>{children}</label>
  );
};

export const FormControl = ({ children }: any) => {
  // Add the field ID to the child input if it's a simple element
  const { fieldId } = React.useContext(FormContext);

  // If children is a simple element (like input, textarea, select), add the id
  if (React.isValidElement(children) && typeof children.type === 'string') {
    return (
      <div data-testid="form-control">
        {React.cloneElement(children, { id: fieldId })}
      </div>
    );
  }

  return (
    <div data-testid="form-control">{children}</div>
  );
};

export const FormDescription = ({ children }: any) => (
  <div data-testid="form-description">{children}</div>
);

export const FormMessage = ({ children }: any) => (
  <div data-testid="form-message">{children}</div>
);
