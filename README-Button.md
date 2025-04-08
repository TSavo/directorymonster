# Button Component Implementation

We've implemented a reusable Button component across the entire application to ensure consistency, accessibility, and maintainability. This README provides an overview of the implementation and how to use the Button component.

## What's Been Done

1. **Implemented Button Component**: Created a versatile Button component with multiple variants, sizes, and states.
2. **Updated All Components**: Replaced all native `<button>` elements with our Button component.
3. **Added Documentation**: Created comprehensive documentation and a style guide.
4. **Enhanced Features**: Added new variants, sizes, and props to make the Button component more versatile.
5. **Added Tests**: Created tests to ensure the Button component works as expected.

## Button Component Features

- **Multiple Variants**: Primary, Secondary, Danger, Success, Warning, Ghost, Link, and Outline variants
- **Multiple Sizes**: XS, SM, MD, LG, Icon, and Full Width
- **Loading State**: Visual indicator for asynchronous operations
- **Icons**: Support for left and right icons
- **Loading Text**: Option to show different text when the button is in a loading state
- **Composition**: Can wrap other components like `Link` using the `asChild` prop
- **Accessibility**: Proper focus states and ARIA attributes

## Documentation

We've created comprehensive documentation for the Button component:

1. **Component Documentation**: [docs/components/Button.md](docs/components/Button.md)
2. **Style Guide**: [docs/style-guide/buttons.md](docs/style-guide/buttons.md)
3. **Example Usage**: [docs/examples/button-examples.md](docs/examples/button-examples.md)

## How to Use the Button Component

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

// With loading text
<Button isLoading={isSubmitting} loadingText="Saving...">
  Save
</Button>

// With icons
<Button leftIcon={<SearchIcon />}>
  Search
</Button>

<Button rightIcon={<ArrowRightIcon />}>
  Next
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

## Best Practices

1. Use the appropriate variant for the action:
   - `primary` for main actions
   - `secondary` for secondary actions
   - `danger` for destructive actions
   - `success` for success or confirmation actions
   - `warning` for warning or caution actions
   - `ghost` for less important actions
   - `link` for navigation-like actions
   - `outline` and `outline-*` for outlined versions of other variants

2. Use the appropriate size for the context:
   - `xs` for very compact UIs or inline buttons
   - `sm` for compact UIs or less important actions
   - `md` for most actions
   - `lg` for prominent actions
   - `icon` for icon-only buttons
   - `full` for buttons that should span the full width of their container

3. Always include descriptive text or an aria-label for icon-only buttons.

4. Use the `isLoading` prop for asynchronous operations to provide visual feedback.

5. When using `asChild` with Link components, ensure the Link has appropriate attributes like `href`.

## Next Steps

1. **Review the Documentation**: Please review the documentation and provide feedback.
2. **Use the Button Component**: Start using the Button component in your new code.
3. **Report Issues**: If you encounter any issues or have suggestions for improvements, please report them.
4. **Contribute**: Feel free to contribute to the Button component by adding new features or improving existing ones.

## Questions?

If you have any questions about the Button component or how to use it, please reach out to the team.
