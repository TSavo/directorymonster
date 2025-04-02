# Fix Suggestions for tests\admin\sites\components\BasicInfoStep.test.tsx

## Missing data-testid attributes

- `site-form-name`
- `site-form-slug`
- `site-form-description`
- `site-form-slug-helper`

## Component Files

- src\components\admin\sites\components\BasicInfoStep.tsx
- src\components\admin\listings\components\form\BasicInfoStep.tsx

## Existing data-testid attributes in components

- `siteForm-fieldset`
- `siteForm-basic-info-heading`
- `siteForm-name`
- `siteForm-name-error`
- `siteForm-slug`
- `siteForm-slug-error`
- `siteForm-description`
- `siteForm-description-error`
- `listing-form-basic-info`
- `listing-title-input`
- `listing-status-select`
- `listing-description-textarea`

## Possible Solutions

### Option 1: Update the component

Add the missing data-testid attributes to the component:

```jsx
data-testid="site-form-name"
```

```jsx
data-testid="site-form-slug"
```

```jsx
data-testid="site-form-description"
```

```jsx
data-testid="site-form-slug-helper"
```

### Option 2: Update the test

Update the test to use existing data-testid attributes:

No similar existing test IDs found for `site-form-name`

No similar existing test IDs found for `site-form-slug`

No similar existing test IDs found for `site-form-description`

No similar existing test IDs found for `site-form-slug-helper`

### Option 3: Update mocks

If the test is using mocks, update them to include the missing data-testid attributes:

No obvious mocks found in the test file. If you're using mocks, make sure they include the missing data-testid attributes.

