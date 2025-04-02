# Fix Suggestions for tests\admin\sites\components\StepNavigation.test.tsx

## Missing data-testid attributes

- `step-button-basic-info`
- `step-button-domains`
- `step-button-theme`
- `step-button-seo`

## Component Files

- src\components\admin\sites\components\StepNavigation.tsx

## Existing data-testid attributes in components

- `site-form-steps-navigation`

## Possible Solutions

### Option 1: Update the component

Add the missing data-testid attributes to the component:

```jsx
data-testid="step-button-basic-info"
```

```jsx
data-testid="step-button-domains"
```

```jsx
data-testid="step-button-theme"
```

```jsx
data-testid="step-button-seo"
```

### Option 2: Update the test

Update the test to use existing data-testid attributes:

No similar existing test IDs found for `step-button-basic-info`

No similar existing test IDs found for `step-button-domains`

No similar existing test IDs found for `step-button-theme`

No similar existing test IDs found for `step-button-seo`

### Option 3: Update mocks

If the test is using mocks, update them to include the missing data-testid attributes:

No obvious mocks found in the test file. If you're using mocks, make sure they include the missing data-testid attributes.

