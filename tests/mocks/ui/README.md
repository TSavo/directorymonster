# UI Component Mocks

This directory contains mock implementations of UI components used in tests. These mocks provide minimal implementations that satisfy test requirements without needing the full UI library functionality.

## Available Mocks

- `button.tsx` - Mock implementation of the Button component
- `input.tsx` - Mock implementation of the Input component
- `select.tsx` - Mock implementation of the Select component
- `badge.tsx` - Mock implementation of the Badge component
- `checkbox.tsx` - Mock implementation of the Checkbox component
- `dropdown-menu.tsx` - Mock implementations of DropdownMenu and DropdownMenuItem components
- `card.tsx` - Mock implementations of Card, CardHeader, CardTitle, CardDescription, CardContent, and CardFooter components
- `sheet.tsx` - Mock implementations of Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, and SheetClose components
- `accordion.tsx` - Mock implementations of Accordion, AccordionItem, AccordionTrigger, and AccordionContent components
- `label.tsx` - Mock implementation of the Label component

## Usage

The mocks are automatically loaded via the Jest configuration. The setup file in `tests/mocks/ui-setup.js` configures Jest to use these mocks whenever components are imported from `@/ui/*` or relative paths like `../../../../ui/*`.

No additional configuration is needed in individual test files.

## Adding New Mocks

To add a new UI component mock:

1. Create a new file in this directory with the same name as the original component
2. Implement a minimal version of the component that satisfies test requirements
3. Add it to the exports in `index.ts`
4. Add the appropriate mock configuration in `ui-setup.js`
