# Button Component

The Button component is a versatile, reusable UI element that provides a consistent look and feel across the application. It supports various variants, sizes, and states to accommodate different use cases.

## Features

- **Multiple Variants**: Primary, Secondary, Danger, Ghost, and Link
- **Multiple Sizes**: Small, Medium, Large, and Icon
- **Loading State**: Visual indicator for asynchronous operations
- **Composition**: Can wrap other components like `Link` using the `asChild` prop
- **Accessibility**: Proper focus states and ARIA attributes

## Usage

```tsx
import { Button } from '@/components/ui/Button';

// Basic usage
<Button>Click Me</Button>

// With variant and size
<Button variant="primary" size="md">
  Submit
</Button>

// With loading state
<Button isLoading={isSubmitting}>
  Save
</Button>

// As a link (Next.js Link)
<Button asChild variant="secondary">
  <Link href="/some-page">Go to Page</Link>
</Button>

// With icon
<Button variant="ghost" size="icon">
  <SomeIcon />
</Button>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost' \| 'link'` | `'primary'` | The visual style of the button |
| `size` | `'sm' \| 'md' \| 'lg' \| 'icon'` | `'md'` | The size of the button |
| `isLoading` | `boolean` | `false` | Whether the button is in a loading state |
| `asChild` | `boolean` | `false` | Whether to render the children directly with the button props |
| `className` | `string` | `''` | Additional CSS classes to apply |
| `disabled` | `boolean` | `false` | Whether the button is disabled |
| `...props` | `ButtonHTMLAttributes<HTMLButtonElement>` | - | All other props are passed to the underlying button element |

## Variants

### Primary

The primary button is used for the main action in a form or page. It has a solid background color and is visually prominent.

```tsx
<Button variant="primary">Primary Button</Button>
```

### Secondary

The secondary button is used for secondary actions. It has a white background with a border.

```tsx
<Button variant="secondary">Secondary Button</Button>
```

### Danger

The danger button is used for destructive actions like delete or remove. It has a red background.

```tsx
<Button variant="danger">Delete</Button>
```

### Ghost

The ghost button is used for less important actions. It has no background or border until hovered.

```tsx
<Button variant="ghost">Ghost Button</Button>
```

### Link

The link button looks like a text link but behaves like a button. It's useful for navigation-like actions within a page.

```tsx
<Button variant="link">Link Button</Button>
```

## Sizes

### Small (sm)

```tsx
<Button size="sm">Small Button</Button>
```

### Medium (md)

```tsx
<Button size="md">Medium Button</Button>
```

### Large (lg)

```tsx
<Button size="lg">Large Button</Button>
```

### Icon

```tsx
<Button size="icon">
  <SomeIcon />
</Button>
```

## Loading State

When `isLoading` is `true`, the button will display a spinner and disable user interaction.

```tsx
<Button isLoading={isSubmitting}>
  Save
</Button>
```

## Composition with Next.js Link

The `asChild` prop allows you to compose the Button with other components like Next.js Link.

```tsx
<Button asChild variant="secondary">
  <Link href="/some-page">Go to Page</Link>
</Button>
```

## Accessibility

The Button component includes proper focus states and ARIA attributes to ensure accessibility. When using the `asChild` prop with a Link component, make sure to include appropriate ARIA attributes if needed.

## Best Practices

1. Use the appropriate variant for the action:
   - `primary` for main actions
   - `secondary` for secondary actions
   - `danger` for destructive actions
   - `ghost` for less important actions
   - `link` for navigation-like actions

2. Use the appropriate size for the context:
   - `sm` for compact UIs or less important actions
   - `md` for most actions
   - `lg` for prominent actions
   - `icon` for icon-only buttons

3. Always include descriptive text or an aria-label for icon-only buttons.

4. Use the `isLoading` prop for asynchronous operations to provide visual feedback.

5. When using `asChild` with Link components, ensure the Link has appropriate attributes like `href`.
