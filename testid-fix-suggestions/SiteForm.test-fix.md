# Fix Suggestions for tests\admin\sites\SiteForm.test.tsx

## Missing data-testid attributes

- `siteForm-basic-info-heading`
- `siteForm-name`
- `siteForm-slug`
- `siteForm-description`
- `next-button`
- `step-button-domains`
- `domainStep-heading`
- `domainStep-domain-input`
- `domainStep-add-domain`
- `cancel-button`
- `step-button-basic_info`

## Component Files

- src\components\admin\sites\SiteForm.tsx

## Existing data-testid attributes in components

- `site-form`
- `siteForm-header`
- `siteForm-error`
- `siteForm-success`
- `siteForm-form`
- `step-content`

## Possible Solutions

### Option 1: Update the component

Add the missing data-testid attributes to the component:

```jsx
data-testid="siteForm-basic-info-heading"
```

```jsx
data-testid="siteForm-name"
```

```jsx
data-testid="siteForm-slug"
```

```jsx
data-testid="siteForm-description"
```

```jsx
data-testid="next-button"
```

```jsx
data-testid="step-button-domains"
```

```jsx
data-testid="domainStep-heading"
```

```jsx
data-testid="domainStep-domain-input"
```

```jsx
data-testid="domainStep-add-domain"
```

```jsx
data-testid="cancel-button"
```

```jsx
data-testid="step-button-basic_info"
```

### Option 2: Update the test

Update the test to use existing data-testid attributes:

No similar existing test IDs found for `siteForm-basic-info-heading`

No similar existing test IDs found for `siteForm-name`

No similar existing test IDs found for `siteForm-slug`

No similar existing test IDs found for `siteForm-description`

No similar existing test IDs found for `next-button`

No similar existing test IDs found for `step-button-domains`

No similar existing test IDs found for `domainStep-heading`

No similar existing test IDs found for `domainStep-domain-input`

No similar existing test IDs found for `domainStep-add-domain`

No similar existing test IDs found for `cancel-button`

No similar existing test IDs found for `step-button-basic_info`

### Option 3: Update mocks

If the test is using mocks, update them to include the missing data-testid attributes:

Found potential mocks in the test file:

```js
jest.mock('next/navigation', ()
```

```js
jest.mock('@/components/admin/sites/hooks', ()
```

Consider updating these mocks to include the missing data-testid attributes.

