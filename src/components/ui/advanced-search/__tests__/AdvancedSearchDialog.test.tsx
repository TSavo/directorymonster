import React from 'react';
import { render } from '@/tests/utils/render';
import { AdvancedSearchDialog } from '../AdvancedSearchDialog';
import { AdvancedSearchContainer } from '../AdvancedSearchContainer';

// Mock the AdvancedSearchContainer component
jest.mock('../AdvancedSearchContainer', () => ({
  AdvancedSearchContainer: jest.fn(() => <div data-testid="mock-container" />)
}));

describe('AdvancedSearchDialog', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the container component', () => {
    // Render the dialog
    render(<AdvancedSearchDialog />);

    // Check that the container component was rendered
    expect(AdvancedSearchContainer).toHaveBeenCalled();
  });

  it('passes children to the container component', () => {
    // Render the dialog with children
    render(
      <AdvancedSearchDialog>
        <button>Custom Trigger</button>
      </AdvancedSearchDialog>
    );

    // Check that the container component was rendered with children
    expect(AdvancedSearchContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        children: <button>Custom Trigger</button>
      }),
      expect.anything()
    );
  });

  it('passes searchPath to the container component', () => {
    // Render the dialog with searchPath
    render(<AdvancedSearchDialog searchPath="/custom/search" />);

    // Check that the container component was rendered with searchPath
    expect(AdvancedSearchContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        searchPath: '/custom/search'
      }),
      expect.anything()
    );
  });

  it('passes triggerButtonVariant to the container component', () => {
    // Render the dialog with triggerButtonVariant
    render(<AdvancedSearchDialog triggerButtonVariant="ghost" />);

    // Check that the container component was rendered with triggerButtonVariant
    expect(AdvancedSearchContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        triggerButtonVariant: 'ghost'
      }),
      expect.anything()
    );
  });

  it('passes triggerButtonSize to the container component', () => {
    // Render the dialog with triggerButtonSize
    render(<AdvancedSearchDialog triggerButtonSize="lg" />);

    // Check that the container component was rendered with triggerButtonSize
    expect(AdvancedSearchContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        triggerButtonSize: 'lg'
      }),
      expect.anything()
    );
  });

  it('passes triggerButtonClassName to the container component', () => {
    // Render the dialog with triggerButtonClassName
    render(<AdvancedSearchDialog triggerButtonClassName="custom-button-class" />);

    // Check that the container component was rendered with triggerButtonClassName
    expect(AdvancedSearchContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        triggerButtonClassName: 'custom-button-class'
      }),
      expect.anything()
    );
  });

  it('passes dialogClassName to the container component', () => {
    // Render the dialog with dialogClassName
    render(<AdvancedSearchDialog dialogClassName="custom-dialog-class" />);

    // Check that the container component was rendered with dialogClassName
    expect(AdvancedSearchContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        dialogClassName: 'custom-dialog-class'
      }),
      expect.anything()
    );
  });

  it('uses default values when props are not provided', () => {
    // Render the dialog without props
    render(<AdvancedSearchDialog />);

    // Check that the container component was rendered with default values
    expect(AdvancedSearchContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        searchPath: '/admin/search',
        triggerButtonVariant: 'outline',
        triggerButtonSize: 'sm'
      }),
      expect.anything()
    );
  });
});
