# Fix Suggestions for tests\admin\sites\table\SiteTableRow.test.tsx

## Missing data-testid attributes

- `site-name-site-123`
- `site-slug-site-123`
- `site-domains-site-123`
- `site-edit-button-site-123`
- `site-delete-button-site-123`

## Component Files

- src\components\admin\sites\table\SiteTableRow.tsx

## Existing data-testid attributes in components


## Possible Solutions

### Option 1: Update the component

Add the missing data-testid attributes to the component:

```jsx
data-testid="site-name-site-123"
```

```jsx
data-testid="site-slug-site-123"
```

```jsx
data-testid="site-domains-site-123"
```

```jsx
data-testid="site-edit-button-site-123"
```

```jsx
data-testid="site-delete-button-site-123"
```

### Option 2: Update the test

Update the test to use existing data-testid attributes:

No similar existing test IDs found for `site-name-site-123`

No similar existing test IDs found for `site-slug-site-123`

No similar existing test IDs found for `site-domains-site-123`

No similar existing test IDs found for `site-edit-button-site-123`

No similar existing test IDs found for `site-delete-button-site-123`

### Option 3: Update mocks

If the test is using mocks, update them to include the missing data-testid attributes:

No obvious mocks found in the test file. If you're using mocks, make sure they include the missing data-testid attributes.

