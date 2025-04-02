# Fix Suggestions for tests\admin\sites\table\DeleteConfirmationModal.test.tsx

## Missing data-testid attributes

- `delete-modal`
- `delete-modal-title`
- `delete-modal-content`
- `delete-modal-cancel`
- `delete-modal-confirm`

## Component Files

- src\components\admin\sites\table\DeleteConfirmationModal.tsx
- src\components\admin\listings\components\DeleteConfirmationModal.tsx
- src\components\admin\categories\components\DeleteConfirmationModal.tsx

## Existing data-testid attributes in components

- `delete-confirmation-modal`
- `modal-backdrop`
- `modal-title`
- `confirm-delete-button`
- `cancel-delete-button`
- `modal-content`
- `modal-description`
- `item-name`
- `cancel-button`

## Possible Solutions

### Option 1: Update the component

Add the missing data-testid attributes to the component:

```jsx
data-testid="delete-modal"
```

```jsx
data-testid="delete-modal-title"
```

```jsx
data-testid="delete-modal-content"
```

```jsx
data-testid="delete-modal-cancel"
```

```jsx
data-testid="delete-modal-confirm"
```

### Option 2: Update the test

Update the test to use existing data-testid attributes:

No similar existing test IDs found for `delete-modal`

No similar existing test IDs found for `delete-modal-title`

No similar existing test IDs found for `delete-modal-content`

No similar existing test IDs found for `delete-modal-cancel`

No similar existing test IDs found for `delete-modal-confirm`

### Option 3: Update mocks

If the test is using mocks, update them to include the missing data-testid attributes:

No obvious mocks found in the test file. If you're using mocks, make sure they include the missing data-testid attributes.

