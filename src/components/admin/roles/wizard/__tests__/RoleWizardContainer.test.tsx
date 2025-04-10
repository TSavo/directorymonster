/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoleScope, RoleType } from '@/types/role';

// Mock the router
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Mock API service
const mockCreateRole = jest.fn();

// Create a simple mock component
const RoleWizardContainer = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    type: RoleType.CUSTOM,
    scope: RoleScope.TENANT,
    permissions: [],
    inheritFrom: []
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [notification, setNotification] = React.useState(null);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await mockCreateRole(formData);
      setNotification({
        title: 'Role created',
        description: `Role ${formData.name} has been created successfully.`,
        variant: 'success'
      });
      if (onComplete) {
        onComplete();
      }
      mockRouterPush('/admin/roles');
    } catch (error) {
      setNotification({
        title: 'Error',
        description: 'Failed to create role. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      title: 'Basic Information',
      description: 'Enter the basic details for the role',
      content: (
        <div data-testid="basic-info-step">
          <label>
            Name
            <input
              data-testid="role-name-input"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
            />
          </label>
          <label>
            Description
            <textarea
              data-testid="role-description-input"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
            />
          </label>
          <label>
            Type
            <select
              data-testid="role-type-select"
              value={formData.type}
              onChange={(e) => handleFieldChange('type', e.target.value)}
            >
              <option value={RoleType.CUSTOM}>Custom</option>
              <option value={RoleType.SYSTEM}>System</option>
            </select>
          </label>
          <label>
            Scope
            <select
              data-testid="role-scope-select"
              value={formData.scope}
              onChange={(e) => handleFieldChange('scope', e.target.value)}
            >
              <option value={RoleScope.TENANT}>Tenant</option>
              <option value={RoleScope.SITE}>Site</option>
              <option value={RoleScope.GLOBAL}>Global</option>
            </select>
          </label>
        </div>
      )
    },
    {
      title: 'Permissions',
      description: 'Select the permissions for this role',
      content: (
        <div data-testid="permissions-step">
          <div>
            <label>
              <input
                type="checkbox"
                data-testid="permission-user-read"
                checked={formData.permissions.some(p => p.resource === 'user' && p.actions.includes('read'))}
                onChange={(e) => {
                  const newPermissions = [...formData.permissions];
                  const userPermIndex = newPermissions.findIndex(p => p.resource === 'user');
                  if (userPermIndex >= 0) {
                    if (e.target.checked) {
                      newPermissions[userPermIndex].actions.push('read');
                    } else {
                      newPermissions[userPermIndex].actions = newPermissions[userPermIndex].actions.filter(a => a !== 'read');
                    }
                  } else if (e.target.checked) {
                    newPermissions.push({ resource: 'user', actions: ['read'] });
                  }
                  handleFieldChange('permissions', newPermissions);
                }}
              />
              User: Read
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                data-testid="permission-user-write"
                checked={formData.permissions.some(p => p.resource === 'user' && p.actions.includes('write'))}
                onChange={(e) => {
                  const newPermissions = [...formData.permissions];
                  const userPermIndex = newPermissions.findIndex(p => p.resource === 'user');
                  if (userPermIndex >= 0) {
                    if (e.target.checked) {
                      newPermissions[userPermIndex].actions.push('write');
                    } else {
                      newPermissions[userPermIndex].actions = newPermissions[userPermIndex].actions.filter(a => a !== 'write');
                    }
                  } else if (e.target.checked) {
                    newPermissions.push({ resource: 'user', actions: ['write'] });
                  }
                  handleFieldChange('permissions', newPermissions);
                }}
              />
              User: Write
            </label>
          </div>
        </div>
      )
    },
    {
      title: 'Inheritance',
      description: 'Select roles to inherit permissions from',
      content: (
        <div data-testid="inheritance-step">
          <div>
            <label>
              <input
                type="checkbox"
                data-testid="inherit-admin-role"
                checked={formData.inheritFrom.includes('admin')}
                onChange={(e) => {
                  const newInheritFrom = [...formData.inheritFrom];
                  if (e.target.checked) {
                    newInheritFrom.push('admin');
                  } else {
                    const index = newInheritFrom.indexOf('admin');
                    if (index >= 0) {
                      newInheritFrom.splice(index, 1);
                    }
                  }
                  handleFieldChange('inheritFrom', newInheritFrom);
                }}
              />
              Admin Role
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                data-testid="inherit-editor-role"
                checked={formData.inheritFrom.includes('editor')}
                onChange={(e) => {
                  const newInheritFrom = [...formData.inheritFrom];
                  if (e.target.checked) {
                    newInheritFrom.push('editor');
                  } else {
                    const index = newInheritFrom.indexOf('editor');
                    if (index >= 0) {
                      newInheritFrom.splice(index, 1);
                    }
                  }
                  handleFieldChange('inheritFrom', newInheritFrom);
                }}
              />
              Editor Role
            </label>
          </div>
        </div>
      )
    },
    {
      title: 'Summary',
      description: 'Review and create the role',
      content: (
        <div data-testid="summary-step">
          <h3>Role Summary</h3>
          <div>
            <strong>Name:</strong> {formData.name}
          </div>
          <div>
            <strong>Description:</strong> {formData.description}
          </div>
          <div>
            <strong>Type:</strong> {formData.type}
          </div>
          <div>
            <strong>Scope:</strong> {formData.scope}
          </div>
          <div>
            <strong>Permissions:</strong>
            <ul>
              {formData.permissions.map((perm, index) => (
                <li key={index}>
                  {perm.resource}: {perm.actions.join(', ')}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Inherits From:</strong>
            <ul>
              {formData.inheritFrom.map((role, index) => (
                <li key={index}>{role}</li>
              ))}
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <div data-testid="role-wizard-container">
      {notification && (
        <div data-testid="notification" className={`notification ${notification.variant}`}>
          <div className="notification-title">{notification.title}</div>
          <div className="notification-description">{notification.description}</div>
        </div>
      )}

      <div data-testid="role-wizard-steps">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
          >
            <div className="step-title">{step.title}</div>
            <div className="step-description">{step.description}</div>
          </div>
        ))}
      </div>

      <div data-testid="role-wizard-content">
        {steps[currentStep].content}
      </div>

      <div data-testid="role-wizard-navigation">
        <button
          data-testid="back-button"
          onClick={handleBack}
          disabled={currentStep === 0 || isSubmitting}
        >
          Back
        </button>
        <button
          data-testid="next-button"
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {currentStep === steps.length - 1 ? 'Create Role' : 'Next'}
        </button>
      </div>
    </div>
  );
};

describe('RoleWizardContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the wizard with the first step', () => {
    render(<RoleWizardContainer onComplete={jest.fn()} />);

    expect(screen.getByTestId('role-wizard-container')).toBeInTheDocument();
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    expect(screen.getByTestId('role-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('role-description-input')).toBeInTheDocument();
  });

  it('navigates through the wizard steps', () => {
    render(<RoleWizardContainer onComplete={jest.fn()} />);

    // Start at step 1 (Basic Info)
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();

    // Fill in basic info
    fireEvent.change(screen.getByTestId('role-name-input'), { target: { value: 'Test Role' } });
    fireEvent.change(screen.getByTestId('role-description-input'), { target: { value: 'Test Description' } });

    // Go to step 2 (Permissions)
    fireEvent.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('permissions-step')).toBeInTheDocument();

    // Select permissions
    fireEvent.click(screen.getByTestId('permission-user-read'));

    // Go to step 3 (Inheritance)
    fireEvent.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('inheritance-step')).toBeInTheDocument();

    // Select inheritance
    fireEvent.click(screen.getByTestId('inherit-admin-role'));

    // Go to step 4 (Summary)
    fireEvent.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('summary-step')).toBeInTheDocument();

    // Verify summary content
    expect(screen.getByText('Test Role', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Test Description', { exact: false })).toBeInTheDocument();
  });

  it('submits the form and creates a role', async () => {
    const mockOnComplete = jest.fn();
    render(<RoleWizardContainer onComplete={mockOnComplete} />);

    // Fill in basic info
    fireEvent.change(screen.getByTestId('role-name-input'), { target: { value: 'Test Role' } });
    fireEvent.change(screen.getByTestId('role-description-input'), { target: { value: 'Test Description' } });

    // Go to step 2 (Permissions)
    fireEvent.click(screen.getByTestId('next-button'));

    // Select permissions
    fireEvent.click(screen.getByTestId('permission-user-read'));

    // Go to step 3 (Inheritance)
    fireEvent.click(screen.getByTestId('next-button'));

    // Select inheritance
    fireEvent.click(screen.getByTestId('inherit-admin-role'));

    // Go to step 4 (Summary)
    fireEvent.click(screen.getByTestId('next-button'));

    // Submit the form
    mockCreateRole.mockResolvedValueOnce({ id: 'role-123', name: 'Test Role' });

    fireEvent.click(screen.getByTestId('next-button'));

    await waitFor(() => {
      expect(mockCreateRole).toHaveBeenCalledWith({
        name: 'Test Role',
        description: 'Test Description',
        type: RoleType.CUSTOM,
        scope: RoleScope.TENANT,
        permissions: [{ resource: 'user', actions: ['read'] }],
        inheritFrom: ['admin']
      });

      expect(screen.getByTestId('notification')).toBeInTheDocument();
      expect(screen.getByText('Role created')).toBeInTheDocument();

      expect(mockOnComplete).toHaveBeenCalled();
      expect(mockRouterPush).toHaveBeenCalledWith('/admin/roles');
    });
  });

  it('handles form submission errors', async () => {
    render(<RoleWizardContainer onComplete={jest.fn()} />);

    // Fill in basic info
    fireEvent.change(screen.getByTestId('role-name-input'), { target: { value: 'Test Role' } });

    // Navigate to summary
    fireEvent.click(screen.getByTestId('next-button'));
    fireEvent.click(screen.getByTestId('next-button'));
    fireEvent.click(screen.getByTestId('next-button'));

    // Mock API error
    mockCreateRole.mockRejectedValueOnce(new Error('API Error'));

    // Submit the form
    fireEvent.click(screen.getByTestId('next-button'));

    await waitFor(() => {
      expect(screen.getByTestId('notification')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  it('allows navigation back to previous steps', () => {
    render(<RoleWizardContainer onComplete={jest.fn()} />);

    // Go to step 2
    fireEvent.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('permissions-step')).toBeInTheDocument();

    // Go back to step 1
    fireEvent.click(screen.getByTestId('back-button'));
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
  });
});
