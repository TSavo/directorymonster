# Button Component Examples

This document provides examples of how to use the Button component in different scenarios.

## Basic Usage

```tsx
import { Button } from '@/components/ui/Button';

// Primary button (default)
<Button>Click Me</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Danger button
<Button variant="danger">Delete</Button>

// Ghost button
<Button variant="ghost">Close</Button>

// Link button
<Button variant="link">Learn More</Button>
```

## Button Sizes

```tsx
// Small button
<Button size="sm">Small</Button>

// Medium button (default)
<Button size="md">Medium</Button>

// Large button
<Button size="lg">Large</Button>

// Icon button
<Button size="icon">
  <SomeIcon />
</Button>
```

## Loading State

```tsx
// Basic loading button
<Button isLoading>Loading</Button>

// Loading button with async function
const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await submitForm(data);
    setIsSuccess(true);
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
};

<Button 
  onClick={handleSubmit} 
  isLoading={isLoading}
>
  Submit
</Button>
```

## Composition with Next.js Link

```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

// Button as a link
<Button asChild variant="secondary">
  <Link href="/some-page">Go to Page</Link>
</Button>

// Primary link button
<Button asChild>
  <Link href="/get-started">Get Started</Link>
</Button>
```

## Form Submission

```tsx
// Form with submit button
<form onSubmit={handleSubmit}>
  {/* Form fields */}
  <div className="flex justify-end space-x-2 mt-4">
    <Button 
      variant="secondary" 
      type="button" 
      onClick={onCancel}
    >
      Cancel
    </Button>
    <Button 
      type="submit" 
      isLoading={isSubmitting}
    >
      Submit
    </Button>
  </div>
</form>
```

## Table Actions

```tsx
// Table row with action buttons
<tr>
  <td>{item.name}</td>
  <td>{item.description}</td>
  <td>
    <div className="flex space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onView(item.id)}
        aria-label={`View ${item.name}`}
      >
        <ViewIcon className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(item.id)}
        aria-label={`Edit ${item.name}`}
      >
        <EditIcon className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(item.id)}
        aria-label={`Delete ${item.name}`}
        className="text-red-600 hover:text-red-800"
      >
        <DeleteIcon className="h-5 w-5" />
      </Button>
    </div>
  </td>
</tr>
```

## Modal Actions

```tsx
// Modal with action buttons
<div className="modal">
  <div className="modal-header">
    <h2>Confirm Action</h2>
    <Button
      variant="ghost"
      size="icon"
      onClick={onClose}
      aria-label="Close"
    >
      <CloseIcon className="h-5 w-5" />
    </Button>
  </div>
  <div className="modal-body">
    Are you sure you want to proceed?
  </div>
  <div className="modal-footer">
    <div className="flex justify-end space-x-2">
      <Button
        variant="secondary"
        onClick={onClose}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={onConfirm}
        isLoading={isConfirming}
      >
        Confirm
      </Button>
    </div>
  </div>
</div>
```

## Filter Actions

```tsx
// Filter form with action buttons
<div className="filter-form">
  {/* Filter fields */}
  <div className="flex justify-between border-t pt-4 mt-4">
    <Button
      variant="link"
      size="sm"
      onClick={onClearFilters}
    >
      Clear Filters
    </Button>
    <Button
      variant="primary"
      size="sm"
      onClick={onApplyFilters}
    >
      Apply
    </Button>
  </div>
</div>
```

## Disabled State

```tsx
// Disabled button
<Button disabled>Disabled</Button>

// Conditionally disabled button
<Button disabled={!isValid}>
  Submit
</Button>

// Disabled button with tooltip
<Tooltip content="Please fill out all required fields">
  <span>
    <Button disabled={!isValid}>
      Submit
    </Button>
  </span>
</Tooltip>
```

## Custom Styling

```tsx
// Button with custom class
<Button className="my-custom-class">
  Custom Styled
</Button>

// Button with inline styles
<Button style={{ marginBottom: '20px' }}>
  Custom Styled
</Button>

// Button with custom colors
<Button className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500">
  Purple Button
</Button>
```

## Responsive Buttons

```tsx
// Button that changes size based on screen size
<Button className="sm:text-sm md:text-base lg:text-lg">
  Responsive Text
</Button>

// Button that changes variant based on screen size
<div className="sm:hidden">
  <Button size="sm">Mobile Button</Button>
</div>
<div className="hidden sm:block">
  <Button size="md">Desktop Button</Button>
</div>
```

## Button Groups

```tsx
// Button group for related actions
<div className="inline-flex rounded-md shadow-sm" role="group">
  <Button
    className="rounded-r-none border-r-0"
    variant="secondary"
    onClick={() => setView('list')}
  >
    List
  </Button>
  <Button
    className="rounded-none border-r-0"
    variant="secondary"
    onClick={() => setView('grid')}
  >
    Grid
  </Button>
  <Button
    className="rounded-l-none"
    variant="secondary"
    onClick={() => setView('table')}
  >
    Table
  </Button>
</div>
```

## Icon with Text

```tsx
// Button with icon and text
<Button>
  <SearchIcon className="mr-2 h-4 w-4" />
  Search
</Button>

// Button with icon and text, right-aligned icon
<Button>
  Next
  <ArrowRightIcon className="ml-2 h-4 w-4" />
</Button>
```

## Full Width Button

```tsx
// Button that takes up the full width of its container
<Button className="w-full">
  Full Width Button
</Button>
```

## Combining Variants and Sizes

```tsx
// Different combinations of variants and sizes
<div className="space-y-2">
  <Button variant="primary" size="sm">Small Primary</Button>
  <Button variant="secondary" size="md">Medium Secondary</Button>
  <Button variant="danger" size="lg">Large Danger</Button>
  <Button variant="ghost" size="icon">
    <StarIcon className="h-5 w-5" />
  </Button>
  <Button variant="link" size="sm">Small Link</Button>
</div>
```
