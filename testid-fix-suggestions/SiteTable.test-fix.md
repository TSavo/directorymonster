# Fix Suggestions for tests\admin\sites\table\SiteTable.test.tsx

## Missing data-testid attributes

- `site-table-header-name`
- `site-table-header-slug`
- `site-table-header-domains`
- `site-table-header-last-modified`
- `site-table-header-status`
- `site-table-header-actions`
- `site-row-site-1`
- `site-row-site-2`
- `site-name-site-1`
- `site-slug-site-1`
- `site-domains-site-1`
- `site-status-site-1`
- `site-name-site-2`
- `site-slug-site-2`
- `site-domains-site-2`
- `site-status-site-2`
- `site-edit-button-site-1`
- `site-delete-button-site-1`
- `site-edit-button-site-2`
- `site-delete-button-site-2`

## Component Files

- src\components\admin\sites\table\SiteTable.tsx

## Existing data-testid attributes in components

- `site-table-loading`
- `site-table-error`
- `retry-button`
- `site-table-empty`
- `site-table`
- `sites-desktop-table`
- `sites-mobile-cards`

## Possible Solutions

### Option 1: Update the component

Add the missing data-testid attributes to the component:

```jsx
data-testid="site-table-header-name"
```

```jsx
data-testid="site-table-header-slug"
```

```jsx
data-testid="site-table-header-domains"
```

```jsx
data-testid="site-table-header-last-modified"
```

```jsx
data-testid="site-table-header-status"
```

```jsx
data-testid="site-table-header-actions"
```

```jsx
data-testid="site-row-site-1"
```

```jsx
data-testid="site-row-site-2"
```

```jsx
data-testid="site-name-site-1"
```

```jsx
data-testid="site-slug-site-1"
```

```jsx
data-testid="site-domains-site-1"
```

```jsx
data-testid="site-status-site-1"
```

```jsx
data-testid="site-name-site-2"
```

```jsx
data-testid="site-slug-site-2"
```

```jsx
data-testid="site-domains-site-2"
```

```jsx
data-testid="site-status-site-2"
```

```jsx
data-testid="site-edit-button-site-1"
```

```jsx
data-testid="site-delete-button-site-1"
```

```jsx
data-testid="site-edit-button-site-2"
```

```jsx
data-testid="site-delete-button-site-2"
```

### Option 2: Update the test

Update the test to use existing data-testid attributes:

No similar existing test IDs found for `site-table-header-name`

No similar existing test IDs found for `site-table-header-slug`

No similar existing test IDs found for `site-table-header-domains`

No similar existing test IDs found for `site-table-header-last-modified`

No similar existing test IDs found for `site-table-header-status`

No similar existing test IDs found for `site-table-header-actions`

No similar existing test IDs found for `site-row-site-1`

No similar existing test IDs found for `site-row-site-2`

No similar existing test IDs found for `site-name-site-1`

No similar existing test IDs found for `site-slug-site-1`

No similar existing test IDs found for `site-domains-site-1`

No similar existing test IDs found for `site-status-site-1`

No similar existing test IDs found for `site-name-site-2`

No similar existing test IDs found for `site-slug-site-2`

No similar existing test IDs found for `site-domains-site-2`

No similar existing test IDs found for `site-status-site-2`

No similar existing test IDs found for `site-edit-button-site-1`

No similar existing test IDs found for `site-delete-button-site-1`

No similar existing test IDs found for `site-edit-button-site-2`

No similar existing test IDs found for `site-delete-button-site-2`

### Option 3: Update mocks

If the test is using mocks, update them to include the missing data-testid attributes:

Found potential mocks in the test file:

```js
jest.mock('@/components/admin/sites/hooks/useSites', ()
```

```js
jest.mock('next/navigation', ()
```

Consider updating these mocks to include the missing data-testid attributes.

