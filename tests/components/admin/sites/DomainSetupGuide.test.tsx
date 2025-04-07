/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    render(<DomainSetupGuide {...mockProps} />);
    expect(screen.getByText('Pending Verification')).toBeInTheDocument();
    
    // Test verified status
    render(<DomainSetupGuide {...mockProps} verificationStatus="verified" />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
    
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
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('@')).toBeInTheDocument();
    expect(screen.getByText('76.76.21.21')).toBeInTheDocument();
    
    // Check CNAME record
    expect(screen.getByText('CNAME')).toBeInTheDocument();
    expect(screen.getByText('www')).toBeInTheDocument();
    expect(screen.getByText(`${mockProps.siteSlug}.mydirectory.com`)).toBeInTheDocument();
  });

  it('switches between different provider tabs', () => {
    render(<DomainSetupGuide {...mockProps} />);
    
    // Default tab is "General Instructions"
    expect(screen.getByText('Step 1: Access your domain provider\'s DNS settings')).toBeInTheDocument();
    
    // Switch to GoDaddy tab
    fireEvent.click(screen.getByText('GoDaddy'));
    expect(screen.getByText('GoDaddy-specific instructions')).toBeInTheDocument();
    
    // Switch to Namecheap tab
    fireEvent.click(screen.getByText('Namecheap'));
    expect(screen.getByText('Namecheap-specific instructions')).toBeInTheDocument();
    
    // Switch to Cloudflare tab
    fireEvent.click(screen.getByText('Cloudflare'));
    expect(screen.getByText('Cloudflare-specific instructions')).toBeInTheDocument();
  });
});
