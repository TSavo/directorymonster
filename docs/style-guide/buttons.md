# Button Style Guide

This style guide provides guidelines for using buttons consistently throughout the application.

## Button Hierarchy

Buttons in our application follow a clear visual hierarchy to guide users through the interface:

1. **Primary Buttons** - For the main action on a page or in a form
2. **Secondary Buttons** - For alternative or secondary actions
3. **Danger Buttons** - For destructive actions
4. **Ghost Buttons** - For tertiary actions or in compact UIs
5. **Link Buttons** - For navigation-like actions within a page

## When to Use Each Variant

### Primary Buttons

Use primary buttons for:
- Form submissions
- Completing a process
- Main call-to-action on a page
- Confirming an action in a modal

```tsx
<Button variant="primary">Submit</Button>
<Button variant="primary">Create Account</Button>
<Button variant="primary">Save Changes</Button>
```

### Secondary Buttons

Use secondary buttons for:
- Alternative actions
- Cancel actions
- Secondary options
- Less important actions that still need visibility

```tsx
<Button variant="secondary">Cancel</Button>
<Button variant="secondary">View Details</Button>
<Button variant="secondary">Filter</Button>
```

### Danger Buttons

Use danger buttons for:
- Destructive actions
- Actions that can't be undone
- Deleting or removing content

```tsx
<Button variant="danger">Delete</Button>
<Button variant="danger">Remove Account</Button>
<Button variant="danger">Permanently Delete</Button>
```

### Ghost Buttons

Use ghost buttons for:
- Toolbar actions
- Less important actions
- Actions in a compact UI
- Icon buttons

```tsx
<Button variant="ghost">Close</Button>
<Button variant="ghost" size="icon"><RefreshIcon /></Button>
```

### Link Buttons

Use link buttons for:
- Navigation-like actions within a page
- Subtle actions that don't need much emphasis
- Actions in text-heavy interfaces

```tsx
<Button variant="link">Learn More</Button>
<Button variant="link">View All</Button>
```

## Button Sizes

### Small (sm)

Use small buttons for:
- Compact UIs
- Table actions
- Secondary actions in a form
- When space is limited

```tsx
<Button size="sm">Filter</Button>
```

### Medium (md)

Use medium buttons for:
- Most standard actions
- Form submissions
- Primary actions in a form

```tsx
<Button size="md">Submit</Button>
```

### Large (lg)

Use large buttons for:
- Main call-to-action on a page
- Important actions that need emphasis
- When you want to draw attention to an action

```tsx
<Button size="lg">Sign Up Now</Button>
```

### Icon (icon)

Use icon buttons for:
- Toolbar actions
- Actions where the icon is universally understood
- When space is very limited

```tsx
<Button size="icon"><EditIcon /></Button>
```

## Button Placement

### Form Actions

In forms, place buttons at the bottom of the form, aligned to the right:

```tsx
<div className="flex justify-end space-x-2">
  <Button variant="secondary" onClick={onCancel}>Cancel</Button>
  <Button variant="primary" type="submit">Submit</Button>
</div>
```

### Modal Actions

In modals, place buttons at the bottom of the modal, aligned to the right:

```tsx
<div className="flex justify-end space-x-2">
  <Button variant="secondary" onClick={onClose}>Cancel</Button>
  <Button variant="primary" onClick={onConfirm}>Confirm</Button>
</div>
```

### Table Actions

In tables, place action buttons in a dedicated actions column, usually the last column:

```tsx
<Button variant="ghost" size="icon" onClick={() => onEdit(item.id)}>
  <EditIcon />
</Button>
<Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
  <DeleteIcon />
</Button>
```

## Loading State

Always use the `isLoading` prop for asynchronous operations to provide visual feedback:

```tsx
<Button isLoading={isSubmitting} type="submit">
  Save Changes
</Button>
```

## Accessibility

### Icon-only Buttons

Always include an `aria-label` for icon-only buttons:

```tsx
<Button 
  variant="ghost" 
  size="icon" 
  aria-label="Edit item"
  onClick={() => onEdit(item.id)}
>
  <EditIcon />
</Button>
```

### Disabled Buttons

Provide alternative ways to communicate why a button is disabled:

```tsx
<div>
  <Button disabled={!isValid} type="submit">
    Submit
  </Button>
  {!isValid && (
    <p className="text-red-500 text-sm mt-1">
      Please fill out all required fields
    </p>
  )}
</div>
```

## Composition with Next.js Link

When using buttons for navigation, use the `asChild` prop with Next.js Link:

```tsx
<Button asChild variant="secondary">
  <Link href="/some-page">Go to Page</Link>
</Button>
```

## Common Patterns

### Form Actions

```tsx
<div className="flex justify-end space-x-2">
  <Button variant="secondary" onClick={onCancel}>
    Cancel
  </Button>
  <Button 
    variant="primary" 
    type="submit" 
    isLoading={isSubmitting}
  >
    {isEditing ? 'Update' : 'Create'}
  </Button>
</div>
```

### Table Actions

```tsx
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
```

### Filter Actions

```tsx
<div className="flex justify-between border-t pt-4">
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
```

### Modal Header

```tsx
<div className="flex justify-between items-center">
  <h2 className="text-xl font-semibold">Modal Title</h2>
  <Button
    variant="ghost"
    size="icon"
    onClick={onClose}
    aria-label="Close"
  >
    <CloseIcon className="h-5 w-5" />
  </Button>
</div>
```
