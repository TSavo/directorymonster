import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SEOStep from '@/components/admin/sites/components/SEOStep';

// Mock the SEOSettings component that's used by SEOStep
jest.mock('@/components/admin/sites/SEOSettings', () => ({
  __esModule: true,
  default: () => <div data-testid="seo-settings-mock">SEO Settings Mock</div>,
  SEOSettings: ({ initialData, onSuccess }) => (
    <div data-testid="seo-settings">
      <input
        data-testid="meta-title-input"
        value={initialData?.seoTitle || ''}
        onChange={(e) => onSuccess({ ...initialData, seoTitle: e.target.value })}
      />
      <textarea
        data-testid="meta-description-input"
        value={initialData?.seoDescription || ''}
        onChange={(e) => onSuccess({ ...initialData, seoDescription: e.target.value })}
      />
      <input
        type="checkbox"
        data-testid="noindex-checkbox"
        checked={initialData?.enableCanonicalUrls || false}
        onChange={(e) => onSuccess({ ...initialData, enableCanonicalUrls: e.target.checked })}
      />
    </div>
  )
}));

describe('SEOStep Component - Interaction', () => {
  // Setup test user for interactions
  const user = userEvent.setup();

  // Mock form values
  const mockValues = {
    id: 'test-id',
    seoTitle: '',
    seoDescription: '',
    enableCanonicalUrls: false
  };

  it('calls onSEOChange when meta title is updated', async () => {
    const mockOnSEOChange = jest.fn();

    render(
      <SEOStep
        values={mockValues}
        onSEOChange={mockOnSEOChange}
        isLoading={false}
      />
    );

    // Type in the meta title input
    const titleInput = screen.getByTestId('meta-title-input');
    await user.type(titleInput, 'New Meta Title');

    // Verify onSEOChange was called with updated SEO data
    expect(mockOnSEOChange).toHaveBeenCalledWith({
      ...mockValues,
      seoTitle: 'N'
    });
  });

  it('calls onSEOChange when canonical URLs checkbox is toggled', async () => {
    const mockOnSEOChange = jest.fn();

    render(
      <SEOStep
        values={mockValues}
        onSEOChange={mockOnSEOChange}
        isLoading={false}
      />
    );

    // Click the checkbox
    const checkbox = screen.getByTestId('noindex-checkbox');
    await user.click(checkbox);

    // Verify onSEOChange was called with updated value
    expect(mockOnSEOChange).toHaveBeenCalledWith({
      ...mockValues,
      enableCanonicalUrls: true
    });
  });
});
