# Test Utilities

This directory contains utility functions and helpers for testing components in the DirectoryMonster project.

## Available Utilities

### Mock Factory (`mock-factory.tsx`)

Provides functions for creating mock components, hooks, and context providers:

- `createMockComponent`: Creates a mock component with the given name and props
- `createMockIcon`: Creates a mock icon component
- `createMockHook`: Creates a mock hook that returns the provided values
- `createMockContextProvider`: Creates a mock context provider
- `createMockNextLink`: Creates a mock for Next.js Link component
- `createMockNextImage`: Creates a mock for Next.js Image component
- `createMockRouter`: Creates a mock for Next.js Router

### Container/Presentation Testing (`container-presentation-testing.tsx`)

Utilities for testing components that follow the container/presentation pattern:

- `renderContainer`: Renders a container component with a mocked presentation component
- `renderPresentation`: Renders a presentation component with mock props
- `createTestWrapper`: Creates a test wrapper for components that need context providers

### Table Testing (`table-testing.tsx`)

Utilities for testing table components:

- `renderTableCell`: Renders a table cell component properly wrapped in a table structure
- `renderTableRow`: Renders a table row component properly wrapped in a table structure
- `renderTable`: Renders a table component properly

### Form Testing (`form-testing.tsx`)

Utilities for testing form components:

- `testForm`: Test a form component with various utilities for filling and submitting
- `testFormField`: Test a specific form field with validation

### API Testing (`api-testing.ts`)

Utilities for testing API routes:

- `createMockRequest`: Create a mock Next.js request
- `parseResponse`: Parse a Next.js response
- `testApiHandler`: Test a Next.js API route handler
- `createMockContext`: Create a mock context for API route handlers
- `createMockDbClient`: Create a mock database client for testing
- `createMockRedisClient`: Create a mock Redis client for testing

## Usage Examples

### Mocking Components

```tsx
import { createMockComponent, createMockIcon } from '../utils/mock-factory';

// Mock a component
jest.mock('@/components/ui/Button', () => createMockComponent('Button'));

// Mock an icon
jest.mock('lucide-react', () => ({
  Search: createMockIcon('Search'),
  X: createMockIcon('X')
}));
```

### Testing Container Components

```tsx
import { renderContainer } from '../utils/container-presentation-testing';
import { MyContainer } from '@/components/MyContainer';

describe('MyContainer', () => {
  it('passes the correct props to the presentation component', () => {
    const mockPresentation = jest.fn(() => <div>Mocked Presentation</div>);

    renderContainer(MyContainer, {
      mockPresentation,
      containerProps: {
        initialValue: 'test'
      }
    });

    expect(mockPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 'test',
        onChange: expect.any(Function)
      }),
      expect.anything()
    );
  });
});
```

### Testing Presentation Components

```tsx
import { renderPresentation } from '../utils/container-presentation-testing';
import { MyPresentation } from '@/components/MyPresentation';

describe('MyPresentation', () => {
  it('renders correctly with props', () => {
    const { getByText } = renderPresentation(MyPresentation, {
      presentationProps: {
        title: 'Test Title',
        items: ['Item 1', 'Item 2']
      }
    });

    expect(getByText('Test Title')).toBeInTheDocument();
    expect(getByText('Item 1')).toBeInTheDocument();
    expect(getByText('Item 2')).toBeInTheDocument();
  });
});
```

### Testing Table Components

```tsx
import { renderTableCell, renderTableRow } from '../utils/table-testing';
import { ListingTableActions } from '@/components/admin/listings/components/ListingTableActions';

describe('ListingTableActions', () => {
  it('renders view, edit, and delete buttons', () => {
    const mockProps = {
      listingId: '123',
      listingSlug: 'test-listing',
      listingTitle: 'Test Listing',
      siteSlug: 'test-site',
      onDeleteClick: jest.fn(),
    };

    renderTableCell(ListingTableActions, mockProps);

    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Test Listing')).toBeInTheDocument();
  });
});
```

### Testing Forms

```tsx
import { testForm, testFormField } from '../utils/form-testing';
import { RegistrationForm } from '@/components/auth/RegistrationForm';

describe('RegistrationForm', () => {
  it('validates email field correctly', async () => {
    const { fillForm } = testForm(RegistrationForm);

    const testEmail = testFormField(
      'email-field',
      'valid@example.com',
      'invalid-email',
      'Please enter a valid email address'
    );

    await testEmail(fillForm);
  });

  it('submits the form with valid data', async () => {
    const onSubmit = jest.fn();
    const { fillForm, submitForm } = testForm(RegistrationForm, { onSubmit });

    await fillForm([
      { name: 'email', testId: 'email-field', value: 'test@example.com' },
      { name: 'password', testId: 'password-field', value: 'Password123!' },
      { name: 'confirmPassword', testId: 'confirm-password-field', value: 'Password123!' }
    ]);

    await submitForm();

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
  });
});
```

### Testing API Routes

```tsx
import { createMockRequest, testApiHandler } from '../utils/api-testing';
import { GET } from '@/app/api/listings/route';

describe('Listings API', () => {
  it('returns listings for a valid request', async () => {
    const request = createMockRequest({
      method: 'GET',
      query: { siteSlug: 'test-site' }
    });

    const { status, body } = await testApiHandler(GET, request);

    expect(status).toBe(200);
    expect(body.listings).toBeInstanceOf(Array);
  });
});
```

### Creating Test Wrappers with Context Providers

```tsx
import { createTestWrapper } from '../utils/container-presentation-testing';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';

const Wrapper = createTestWrapper([
  { Provider: ThemeProvider, props: { theme: 'light' } },
  { Provider: AuthProvider, props: { user: { id: '1', name: 'Test User' } } }
]);

// Use the wrapper in tests
const { getByText } = render(<MyComponent />, { wrapper: Wrapper });
```
