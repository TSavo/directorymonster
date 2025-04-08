# Button Component Enhancement Proposal

This document proposes enhancements to the Button component to make it more versatile and useful across the application.

## Current Implementation

The Button component currently supports the following variants and sizes:

### Variants
- `primary`: Blue background, white text
- `secondary`: White background, gray border, gray text
- `danger`: Red background, white text
- `ghost`: No background or border until hovered
- `link`: Text-only button that looks like a link

### Sizes
- `sm`: Small (h-8, px-3, py-1)
- `md`: Medium (h-10, px-4, py-2)
- `lg`: Large (h-12, px-6, py-3)
- `icon`: Icon-only (h-10, w-10)

## Proposed Enhancements

### New Variants

1. **Success Variant**

A green button for success or confirmation actions.

```tsx
success: "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500",
```

Usage:
```tsx
<Button variant="success">Approve</Button>
<Button variant="success">Confirm</Button>
```

2. **Warning Variant**

An amber/yellow button for warning or caution actions.

```tsx
warning: "bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-400",
```

Usage:
```tsx
<Button variant="warning">Proceed with Caution</Button>
<Button variant="warning">Review First</Button>
```

3. **Outline Variants**

Outlined versions of primary, danger, success, and warning.

```tsx
outline: "border border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500",
"outline-primary": "border border-indigo-600 text-indigo-600 bg-transparent hover:bg-indigo-50 focus-visible:ring-indigo-500",
"outline-danger": "border border-red-600 text-red-600 bg-transparent hover:bg-red-50 focus-visible:ring-red-500",
"outline-success": "border border-green-600 text-green-600 bg-transparent hover:bg-green-50 focus-visible:ring-green-500",
"outline-warning": "border border-amber-500 text-amber-500 bg-transparent hover:bg-amber-50 focus-visible:ring-amber-400",
```

Usage:
```tsx
<Button variant="outline-primary">Outlined Primary</Button>
<Button variant="outline-danger">Outlined Danger</Button>
```

### New Sizes

1. **Extra Small (xs)**

For very compact UIs or inline buttons.

```tsx
xs: "h-6 px-2 py-0.5 text-xs",
```

Usage:
```tsx
<Button size="xs">Tag</Button>
```

2. **Full Width (full)**

For buttons that should span the full width of their container.

```tsx
full: "w-full justify-center",
```

Usage:
```tsx
<Button size="full">Full Width Button</Button>
```

### Additional Props

1. **Left and Right Icons**

Support for adding icons to the left or right of the button text.

```tsx
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

Usage:
```tsx
<Button leftIcon={<SearchIcon />}>Search</Button>
<Button rightIcon={<ArrowRightIcon />}>Next</Button>
```

2. **Loading Text**

Option to show different text when the button is in a loading state.

```tsx
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
}
```

Usage:
```tsx
<Button 
  isLoading={isSubmitting} 
  loadingText="Saving..."
>
  Save
</Button>
```

## Implementation Plan

1. Update the `buttonVariants` definition to include the new variants and sizes
2. Update the `ButtonProps` interface to include the new props
3. Update the Button component to handle the new props
4. Update the documentation and style guide
5. Add tests for the new variants, sizes, and props

## Backward Compatibility

These enhancements are designed to be backward compatible with the existing Button component. Existing code that uses the Button component will continue to work without changes.

## Example Implementation

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500",
        secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500",
        danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
        success: "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500",
        warning: "bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-400",
        ghost: "hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500",
        link: "text-indigo-600 underline-offset-4 hover:underline focus-visible:ring-indigo-500",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500",
        "outline-primary": "border border-indigo-600 text-indigo-600 bg-transparent hover:bg-indigo-50 focus-visible:ring-indigo-500",
        "outline-danger": "border border-red-600 text-red-600 bg-transparent hover:bg-red-50 focus-visible:ring-red-500",
        "outline-success": "border border-green-600 text-green-600 bg-transparent hover:bg-green-50 focus-visible:ring-green-500",
        "outline-warning": "border border-amber-500 text-amber-500 bg-transparent hover:bg-amber-50 focus-visible:ring-amber-400",
      },
      size: {
        xs: "h-6 px-2 py-0.5 text-xs",
        sm: "h-8 px-3 py-1",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 py-3",
        icon: "h-10 w-10",
        full: "w-full justify-center",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    isLoading, 
    asChild, 
    children, 
    leftIcon, 
    rightIcon, 
    loadingText,
    ...props 
  }, ref) => {
    // If asChild is true, we render the children directly with the button props
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn(buttonVariants({ variant, size }), className),
        disabled: isLoading || props.disabled,
        ...props,
        ref
      });
    }

    const buttonText = isLoading && loadingText ? loadingText : children;

    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2">
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        {buttonText}
        {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);
```
