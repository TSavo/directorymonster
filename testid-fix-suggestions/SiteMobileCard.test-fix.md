# Fix Suggestions for tests\admin\sites\table\SiteMobileCard.test.tsx

## Missing data-testid attributes

- `mobile-site-name`
- `mobile-site-slug`
- `mobile-site-domains`
- `mobile-site-status`
- `mobile-edit-button`
- `mobile-delete-button`

## Component Files

- src\components\admin\sites\table\SiteMobileCard.tsx

## Existing data-testid attributes in components


## Possible Solutions

### Option 1: Update the component

Add the missing data-testid attributes to the component:

```jsx
data-testid="mobile-site-name"
```

```jsx
data-testid="mobile-site-slug"
```

```jsx
data-testid="mobile-site-domains"
```

```jsx
data-testid="mobile-site-status"
```

```jsx
data-testid="mobile-edit-button"
```

```jsx
data-testid="mobile-delete-button"
```

### Option 2: Update the test

Update the test to use existing data-testid attributes:

No similar existing test IDs found for `mobile-site-name`

No similar existing test IDs found for `mobile-site-slug`

No similar existing test IDs found for `mobile-site-domains`

No similar existing test IDs found for `mobile-site-status`

No similar existing test IDs found for `mobile-edit-button`

No similar existing test IDs found for `mobile-delete-button`

### Option 3: Update mocks

If the test is using mocks, update them to include the missing data-testid attributes:

No obvious mocks found in the test file. If you're using mocks, make sure they include the missing data-testid attributes.

