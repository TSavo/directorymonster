import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteSettings } from '@/components/admin/sites/SiteSettings';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('SiteSettings Component - Basic Rendering', () => {
  it('renders correctly with default values', () => {
    render(<SiteSettings initialData={{ id: 'site-1' }} />);
    
    // Check if component renders with default values
    expect(screen.getByTestId('siteSettings-header')).toBeInTheDocument();
    expect(screen.getByTestId('siteSettings-isPublic')).toBeChecked();
    expect(screen.getByTestId('siteSettings-theme')).toHaveValue('default');
    expect(screen.getByTestId('siteSettings-listingsPerPage')).toHaveValue(20);
    expect(screen.getByTestId('siteSettings-enableCategories')).toBeChecked();
    expect(screen.getByTestId('siteSettings-enableSearch')).toBeChecked();
    expect(screen.getByTestId('siteSettings-enableUserRegistration')).not.toBeChecked();
    expect(screen.getByTestId('siteSettings-maintenanceMode')).not.toBeChecked();
  });

  it('renders correctly with provided initial data', () => {
    const initialData = {
      id: 'site-1',
      name: 'Test Site',
      slug: 'test-site',
      isPublic: false,
      theme: 'dark',
      listingsPerPage: 50,
      enableCategories: false,
      enableSearch: false,
      enableUserRegistration: true,
      maintenanceMode: true,
      contactEmail: 'test@example.com',
      customStyles: '.test { color: red; }'
    };
    
    render(<SiteSettings initialData={initialData} />);
    
    // Check if component renders with provided values
    expect(screen.getByText('Test Site')).toBeInTheDocument();
    expect(screen.getByText('Slug: test-site')).toBeInTheDocument();
    expect(screen.getByTestId('siteSettings-isPublic')).not.toBeChecked();
    expect(screen.getByTestId('siteSettings-theme')).toHaveValue('dark');
    expect(screen.getByTestId('siteSettings-listingsPerPage')).toHaveValue(50);
    expect(screen.getByTestId('siteSettings-enableCategories')).not.toBeChecked();
    expect(screen.getByTestId('siteSettings-enableSearch')).not.toBeChecked();
    expect(screen.getByTestId('siteSettings-enableUserRegistration')).toBeChecked();
    expect(screen.getByTestId('siteSettings-maintenanceMode')).toBeChecked();
    expect(screen.getByTestId('siteSettings-contactEmail')).toHaveValue('test@example.com');
    expect(screen.getByTestId('siteSettings-customStyles')).toHaveValue('.test { color: red; }');
  });

  it('allows toggling all boolean settings', async () => {
    const user = userEvent.setup();
    
    render(<SiteSettings initialData={{ id: 'site-1' }} />);
    
    // Toggle all boolean settings
    await user.click(screen.getByTestId('siteSettings-isPublic'));
    await user.click(screen.getByTestId('siteSettings-enableCategories'));
    await user.click(screen.getByTestId('siteSettings-enableSearch'));
    await user.click(screen.getByTestId('siteSettings-enableUserRegistration'));
    await user.click(screen.getByTestId('siteSettings-maintenanceMode'));
    
    // Check that all were toggled
    expect(screen.getByTestId('siteSettings-isPublic')).not.toBeChecked();
    expect(screen.getByTestId('siteSettings-enableCategories')).not.toBeChecked();
    expect(screen.getByTestId('siteSettings-enableSearch')).not.toBeChecked();
    expect(screen.getByTestId('siteSettings-enableUserRegistration')).toBeChecked();
    expect(screen.getByTestId('siteSettings-maintenanceMode')).toBeChecked();
    
    // Toggle them back
    await user.click(screen.getByTestId('siteSettings-isPublic'));
    await user.click(screen.getByTestId('siteSettings-enableCategories'));
    await user.click(screen.getByTestId('siteSettings-enableSearch'));
    await user.click(screen.getByTestId('siteSettings-enableUserRegistration'));
    await user.click(screen.getByTestId('siteSettings-maintenanceMode'));
    
    // Check that all were toggled back
    expect(screen.getByTestId('siteSettings-isPublic')).toBeChecked();
    expect(screen.getByTestId('siteSettings-enableCategories')).toBeChecked();
    expect(screen.getByTestId('siteSettings-enableSearch')).toBeChecked();
    expect(screen.getByTestId('siteSettings-enableUserRegistration')).not.toBeChecked();
    expect(screen.getByTestId('siteSettings-maintenanceMode')).not.toBeChecked();
  });

  it('allows selecting different themes', async () => {
    const user = userEvent.setup();
    
    render(<SiteSettings initialData={{ id: 'site-1' }} />);
    
    // Theme select should show all available themes
    const themeOptions = screen.getAllByRole('option');
    expect(themeOptions.length).toBeGreaterThanOrEqual(5); // At least 5 themes
    
    // Try selecting different themes
    await user.selectOptions(screen.getByTestId('siteSettings-theme'), 'dark');
    expect(screen.getByTestId('siteSettings-theme')).toHaveValue('dark');
    
    await user.selectOptions(screen.getByTestId('siteSettings-theme'), 'blue');
    expect(screen.getByTestId('siteSettings-theme')).toHaveValue('blue');
    
    await user.selectOptions(screen.getByTestId('siteSettings-theme'), 'green');
    expect(screen.getByTestId('siteSettings-theme')).toHaveValue('green');
  });

  it('calls cancel callback when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    
    render(<SiteSettings initialData={{ id: 'site-1' }} onCancel={onCancel} />);
    
    // Click cancel button
    await user.click(screen.getByTestId('siteSettings-cancel'));
    
    // Cancel callback should be called
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
