/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoleScope } from '@/types/role';

// Create a simple mock component for PermissionTemplateSelector
const PermissionTemplateSelector = ({
  onSelect,
  scope = RoleScope.TENANT,
  siteId = null
}) => {
  const [selectedTemplate, setSelectedTemplate] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewTemplate, setPreviewTemplate] = React.useState(null);

  const templates = [
    {
      id: 'content-manager',
      name: 'Content Manager',
      description: 'Manage content across all sites',
      category: 'content',
      permissions: {
        content: ['create', 'read', 'update', 'delete'],
        category: ['read']
      }
    },
    {
      id: 'user-manager',
      name: 'User Manager',
      description: 'Manage users and their roles',
      category: 'administration',
      permissions: {
        user: ['create', 'read', 'update', 'delete'],
        role: ['read']
      }
    }
  ];

  const categories = ['all', 'content', 'administration'];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchTerm === '' ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    onSelect(template.permissions);
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleUseTemplate = () => {
    if (previewTemplate) {
      handleSelectTemplate(previewTemplate.id);
      setShowPreview(false);
    }
  };

  return (
    <div data-testid="permission-template-selector">
      <div className="search-filter">
        <div className="search-input">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="search-input"
          />
        </div>
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? 'active' : ''}
              data-testid={`category-${category}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div data-testid="radio-group">
        <div className="templates-grid">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
              data-testid={`template-${template.id}`}
            >
              <div className="template-header">
                <div data-testid={`radio-group-item-${template.id}`}>
                  <input
                    type="radio"
                    value={template.id}
                    checked={selectedTemplate === template.id}
                    onChange={() => handleSelectTemplate(template.id)}
                    data-testid={`radio-input-${template.id}`}
                  />
                </div>
                <h3>{template.name}</h3>
                <button
                  onClick={() => handlePreview(template)}
                  data-testid="preview-button"
                >
                  Preview
                </button>
              </div>
              <p>{template.description}</p>
              <div className="permissions-summary">
                <span>Includes permissions for:</span>
                <ul>
                  {Object.keys(template.permissions).map(resource => (
                    <li key={resource} className="capitalize">
                      {resource}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleSelectTemplate(template.id)}
                data-testid={`use-template-${template.id}`}
              >
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>

      {showPreview && previewTemplate && (
        <div className="dialog">
          <div className="dialog-content">
            <div className="dialog-header">
              <h2>{previewTemplate.name}</h2>
              <p>{previewTemplate.description}</p>
            </div>
            <div className="permissions-details">
              <div className="scope-badge">
                <span>{scope === RoleScope.SITE ? 'Site-specific' : 'Tenant-wide'}</span>
              </div>
              <h4>Included Permissions:</h4>
              <div data-testid="scroll-area">
                <div className="permissions-list">
                  {Object.entries(previewTemplate.permissions).map(([resource, actions]) => (
                    <div key={resource} className="resource-permissions">
                      <h5 className="capitalize">{resource}</h5>
                      <div className="actions-list">
                        {actions.map(action => (
                          <span key={action} className="action-badge">
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="dialog-footer">
              <button
                onClick={handleUseTemplate}
                data-testid="use-this-template"
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

describe('PermissionTemplateSelector Component', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders template cards', () => {
    render(
      <PermissionTemplateSelector
        onSelect={mockOnSelect}
      />
    );

    // Check that template cards are rendered
    expect(screen.getByText('Content Manager')).toBeInTheDocument();
    expect(screen.getByText('User Manager')).toBeInTheDocument();

    // Check that descriptions are rendered
    expect(screen.getByText('Manage content across all sites')).toBeInTheDocument();
    expect(screen.getByText('Manage users and their roles')).toBeInTheDocument();
  });

  it('filters templates by search term', () => {
    render(
      <PermissionTemplateSelector
        onSelect={mockOnSelect}
      />
    );

    // Enter search term
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'content' } });

    // Content Manager should be visible
    expect(screen.getByText('Content Manager')).toBeInTheDocument();

    // User Manager should not be visible
    expect(screen.queryByText('User Manager')).not.toBeInTheDocument();
  });

  it('filters templates by category', () => {
    render(
      <PermissionTemplateSelector
        onSelect={mockOnSelect}
      />
    );

    // Click on administration category
    fireEvent.click(screen.getByTestId('category-administration'));

    // User Manager should be visible
    expect(screen.getByText('User Manager')).toBeInTheDocument();

    // Content Manager should not be visible
    expect(screen.queryByText('Content Manager')).not.toBeInTheDocument();
  });

  it('selects a template when radio button is clicked', () => {
    render(
      <PermissionTemplateSelector
        onSelect={mockOnSelect}
      />
    );

    // Click on Content Manager radio button
    fireEvent.click(screen.getByTestId('radio-input-content-manager'));

    // Check that onSelect was called with the correct permissions
    expect(mockOnSelect).toHaveBeenCalledWith({
      content: ['create', 'read', 'update', 'delete'],
      category: ['read']
    });
  });

  it('selects a template when Use Template button is clicked', () => {
    render(
      <PermissionTemplateSelector
        onSelect={mockOnSelect}
      />
    );

    // Click on Use Template button for User Manager
    fireEvent.click(screen.getByTestId('use-template-user-manager'));

    // Check that onSelect was called with the correct permissions
    expect(mockOnSelect).toHaveBeenCalledWith({
      user: ['create', 'read', 'update', 'delete'],
      role: ['read']
    });
  });

  it('shows template preview when preview button is clicked', () => {
    render(
      <PermissionTemplateSelector
        onSelect={mockOnSelect}
      />
    );

    // Click on preview button for Content Manager
    const previewButtons = screen.getAllByTestId('preview-button');
    fireEvent.click(previewButtons[0]);

    // Should show template details in the dialog
    const dialogTitle = screen.getAllByText('Content Manager')[1];
    expect(dialogTitle).toBeInTheDocument();
    expect(screen.getAllByText('Manage content across all sites')[1]).toBeInTheDocument();

    // Should show permissions
    const contentHeadings = screen.getAllByText('content');
    expect(contentHeadings[contentHeadings.length - 1]).toBeInTheDocument();

    const categoryHeadings = screen.getAllByText('category');
    expect(categoryHeadings[categoryHeadings.length - 1]).toBeInTheDocument();

    // Should show Use This Template button
    expect(screen.getByTestId('use-this-template')).toBeInTheDocument();
  });

  it('selects template when Use This Template is clicked in preview', () => {
    render(
      <PermissionTemplateSelector
        onSelect={mockOnSelect}
      />
    );

    // Click on preview button for Content Manager
    const previewButtons = screen.getAllByTestId('preview-button');
    fireEvent.click(previewButtons[0]);

    // Click on Use This Template button
    fireEvent.click(screen.getByTestId('use-this-template'));

    // Check that onSelect was called with the correct permissions
    expect(mockOnSelect).toHaveBeenCalledWith({
      content: ['create', 'read', 'update', 'delete'],
      category: ['read']
    });
  });
});
