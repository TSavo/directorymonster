import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MediaUploadStep from '@/components/admin/listings/components/form/MediaUploadStep';
import { ListingFormData, ListingMedia } from '@/components/admin/listings/types';
import { MediaType, ListingStatus } from '@/types/listing';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img
      src={props.src}
      alt={props.alt || ''}
      data-testid="mock-image"
      style={props.fill ? { objectFit: 'cover', width: '100%', height: '100%' } : {}}
    />;
  }
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');

describe('MediaUploadStep Component', () => {
  // Mock data
  const mockMedia: ListingMedia[] = [
    {
      id: 'media1',
      url: 'https://example.com/image1.jpg',
      type: MediaType.IMAGE,
      alt: 'Image 1',
      isPrimary: false,
      sortOrder: 0,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    },
    {
      id: 'media2',
      url: 'https://example.com/image2.jpg',
      type: MediaType.IMAGE,
      alt: 'Image 2',
      isPrimary: true,
      sortOrder: 1,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }
  ];

  const mockFormData: ListingFormData = {
    title: 'Test Listing',
    description: 'Test description',
    status: ListingStatus.DRAFT,
    categoryIds: ['cat1'],
    media: [...mockMedia]
  };

  // Default props
  const defaultProps = {
    formData: mockFormData,
    errors: {},
    updateField: jest.fn(),
    isSubmitting: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the component with upload area', () => {
    render(<MediaUploadStep {...defaultProps} />);

    // Check if the component is rendered
    expect(screen.getByTestId('listing-form-media-upload')).toBeInTheDocument();

    // Check if upload area is rendered
    expect(screen.getByText('Upload a file')).toBeInTheDocument();
    expect(screen.getByText('or drag and drop')).toBeInTheDocument();
    expect(screen.getByTestId('media-upload-input')).toBeInTheDocument();
  });

  it('displays existing media items', () => {
    render(<MediaUploadStep {...defaultProps} />);

    // Check if media items are rendered
    expect(screen.getAllByTestId('mock-image')).toHaveLength(2);

    // Check if remove buttons are rendered
    expect(screen.getByTestId('remove-media-media1')).toBeInTheDocument();
    expect(screen.getByTestId('remove-media-media2')).toBeInTheDocument();

    // Check if set primary buttons are rendered
    expect(screen.getByTestId('set-primary-media1')).toBeInTheDocument();
    expect(screen.getByTestId('set-primary-media2')).toBeInTheDocument();
  });

  it('displays validation errors when present', () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        media: 'At least one image is required'
      }
    };

    render(<MediaUploadStep {...propsWithErrors} />);

    // Check if error message is displayed
    expect(screen.getByText('At least one image is required')).toBeInTheDocument();
  });

  it('handles file upload', async () => {
    render(<MediaUploadStep {...defaultProps} />);

    // Create a mock file
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });

    // Trigger file upload
    const input = screen.getByTestId('media-upload-input');
    fireEvent.change(input, { target: { files: [file] } });

    // Check if upload progress is shown
    expect(setTimeout).toHaveBeenCalled();

    // Fast-forward timers
    jest.advanceTimersByTime(2000);

    // Check if updateField was called with new media
    await waitFor(() => {
      expect(defaultProps.updateField).toHaveBeenCalledWith('media', expect.arrayContaining([...mockMedia, expect.any(Object)]));
    });
  });

  it('removes a media item when remove button is clicked', () => {
    render(<MediaUploadStep {...defaultProps} />);

    // Click remove button for the first media item
    fireEvent.click(screen.getByTestId('remove-media-media1'));

    // Check if updateField was called with updated media array
    expect(defaultProps.updateField).toHaveBeenCalledWith('media', [mockMedia[1]]);
  });

  it('sets a media item as primary when set primary button is clicked', async () => {
    render(<MediaUploadStep {...defaultProps} />);

    // Click set primary button for the first media item (which is not primary)
    fireEvent.click(screen.getByTestId('set-primary-media1'));

    // Check if updateField was called with updated media array
    await waitFor(() => {
      expect(defaultProps.updateField).toHaveBeenCalledWith(
        'media',
        [
          { ...mockMedia[0], isPrimary: true },
          { ...mockMedia[1], isPrimary: false }
        ]
      );
    });
  });

  it('disables buttons when isSubmitting is true', () => {
    const submittingProps = {
      ...defaultProps,
      isSubmitting: true
    };

    render(<MediaUploadStep {...submittingProps} />);

    // Check if upload input is disabled
    expect(screen.getByTestId('media-upload-input')).toBeDisabled();

    // Check if remove buttons are disabled
    expect(screen.getByTestId('remove-media-media1')).toBeDisabled();
    expect(screen.getByTestId('remove-media-media2')).toBeDisabled();

    // Check if set primary buttons are disabled
    expect(screen.getByTestId('set-primary-media1')).toBeDisabled();
    expect(screen.getByTestId('set-primary-media2')).toBeDisabled();
  });

  it('handles upload errors gracefully', async () => {
    // Mock console.error to prevent test output pollution
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Mock URL.createObjectURL to throw an error
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = jest.fn(() => {
      throw new Error('Mock upload error');
    });

    render(<MediaUploadStep {...defaultProps} />);

    // Create a mock file
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });

    // Trigger file upload
    const input = screen.getByTestId('media-upload-input');
    fireEvent.change(input, { target: { files: [file] } });

    // Fast-forward timers
    jest.advanceTimersByTime(2000);

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to upload files. Please try again.')).toBeInTheDocument();
    });

    // Restore mocks
    console.error = originalConsoleError;
    URL.createObjectURL = originalCreateObjectURL;
  });

  it('handles empty file selection', () => {
    render(<MediaUploadStep {...defaultProps} />);

    // Trigger file upload with empty files
    const input = screen.getByTestId('media-upload-input');
    fireEvent.change(input, { target: { files: [] } });

    // Check that updateField was not called
    expect(defaultProps.updateField).not.toHaveBeenCalled();
  });

  it('sets first uploaded image as primary when no images exist', async () => {
    const emptyMediaProps = {
      ...defaultProps,
      formData: {
        ...mockFormData,
        media: []
      }
    };

    render(<MediaUploadStep {...emptyMediaProps} />);

    // Create mock files
    const file1 = new File(['dummy content 1'], 'test1.png', { type: 'image/png' });
    const file2 = new File(['dummy content 2'], 'test2.png', { type: 'image/png' });

    // Trigger file upload
    const input = screen.getByTestId('media-upload-input');
    fireEvent.change(input, { target: { files: [file1, file2] } });

    // Fast-forward timers
    jest.advanceTimersByTime(2000);

    // Check if updateField was called with new media where first item is primary
    await waitFor(() => {
      expect(emptyMediaProps.updateField).toHaveBeenCalledWith(
        'media',
        expect.arrayContaining([
          expect.objectContaining({ isPrimary: true }),
          expect.objectContaining({ isPrimary: false })
        ])
      );
    });
  });

  it('maintains primary image when removing non-primary image', () => {
    render(<MediaUploadStep {...defaultProps} />);

    // Click remove button for the second (non-primary) media item
    fireEvent.click(screen.getByTestId('remove-media-media2'));

    // Check if updateField was called with updated media array
    expect(defaultProps.updateField).toHaveBeenCalledWith('media', [mockMedia[0]]);
  });

  it('sets a new primary image when removing the primary image', () => {
    render(<MediaUploadStep {...defaultProps} />);

    // Click remove button for the second (primary) media item
    fireEvent.click(screen.getByTestId('remove-media-media2'));

    // Check if updateField was called with updated media array where the remaining image is primary
    expect(defaultProps.updateField).toHaveBeenCalledWith(
      'media',
      [{ ...mockMedia[0], isPrimary: true }]
    );
  });
});
