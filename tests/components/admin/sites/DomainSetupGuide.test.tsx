/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  InfoIcon: () => <span data-testid="info-icon">Info</span>,
  CheckCircleIcon: () => <span data-testid="check-icon">Check</span>,
  AlertTriangleIcon: () => <span data-testid="alert-icon">Alert</span>,
  CopyIcon: () => <span data-testid="copy-icon">Copy</span>,
  ExternalLinkIcon: () => <span data-testid="external-link-icon">External</span>
}));

import DomainSetupGuide from '@/components/admin/sites/components/DomainSetupGuide';

describe('DomainSetupGuide', () => {
  const mockProps = {
    domain: 'example.com',
    siteSlug: 'test-site',
    verificationStatus: 'pending' as const,
    onVerify: jest.fn(),
    isVerifying: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the domain setup guide with the correct domain', () => {
    render(<DomainSetupGuide {...mockProps} />);

    expect(screen.getByText(`Domain Setup Guide: ${mockProps.domain}`)).toBeInTheDocument();
  });

  it('displays the correct verification status badge', () => {
    // Test pending status
    const { unmount: unmount1 } = render(<DomainSetupGuide {...mockProps} />);
    expect(screen.getByText('Pending Verification')).toBeInTheDocument();
    unmount1();

    // Test verified status
    const { unmount: unmount2 } = render(<DomainSetupGuide {...mockProps} verificationStatus="verified" />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
    unmount2();

    // Test failed status
    render(<DomainSetupGuide {...mockProps} verificationStatus="failed" />);
    expect(screen.getByText('Verification Failed')).toBeInTheDocument();
  });

  it('calls onVerify when the verify button is clicked', () => {
    render(<DomainSetupGuide {...mockProps} />);

    const verifyButton = screen.getByText('Verify Domain');
    fireEvent.click(verifyButton);

    expect(mockProps.onVerify).toHaveBeenCalledTimes(1);
  });

  it('handles copy to clipboard functionality', () => {
    // Mock clipboard API
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn() },
      writable: true
    });

    render(<DomainSetupGuide {...mockProps} />);

    // Find and click the copy buttons
    const copyButtons = screen.getAllByText('Copy');
    fireEvent.click(copyButtons[0]); // Copy A record

    // Verify clipboard was called
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('76.76.21.21');

    // Restore original clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true
    });
  });

  it('disables the verify button when isVerifying is true', () => {
    render(<DomainSetupGuide {...mockProps} isVerifying={true} />);

    const verifyButton = screen.getByText('Verifying...');
    expect(verifyButton).toBeDisabled();
  });

  it('disables the verify button when verification status is verified', () => {
    render(<DomainSetupGuide {...mockProps} verificationStatus="verified" />);

    const verifyButton = screen.getByText('Verify Domain');
    expect(verifyButton).toBeDisabled();
  });

  it('shows DNS records with the correct values', () => {
    render(<DomainSetupGuide {...mockProps} />);

    // Check A record
    expect(screen.getAllByText('A')[0]).toBeInTheDocument();
    expect(screen.getAllByText('@')[0]).toBeInTheDocument();
    expect(screen.getAllByText('76.76.21.21')[0]).toBeInTheDocument();

    // Check CNAME record
    expect(screen.getAllByText('CNAME')[0]).toBeInTheDocument();
    expect(screen.getAllByText('www')[0]).toBeInTheDocument();
    expect(screen.getAllByText(`${mockProps.siteSlug}.mydirectory.com`)[0]).toBeInTheDocument();
  });

  it('renders tabs for different providers', () => {
    render(<DomainSetupGuide {...mockProps} />);

    // Check that all tabs are rendered
    expect(screen.getByText('General Instructions')).toBeInTheDocument();
    expect(screen.getByText('GoDaddy')).toBeInTheDocument();
    expect(screen.getByText('Namecheap')).toBeInTheDocument();
    expect(screen.getByText('Cloudflare')).toBeInTheDocument();

    // Check that the content is rendered
    expect(screen.getByText('Step 1: Access your domain provider\'s DNS settings')).toBeInTheDocument();
    expect(screen.getByText('Step 2: Add the following DNS records')).toBeInTheDocument();
    expect(screen.getByText('Step 3: Verify your domain')).toBeInTheDocument();
  });
});
