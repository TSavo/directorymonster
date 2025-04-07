'use client';

import React, { useState } from 'react';
import { InfoIcon, CheckCircleIcon, AlertTriangleIcon, CopyIcon, ExternalLinkIcon } from 'lucide-react';

// Import UI components
const Tabs = ({ defaultValue, children }: { defaultValue: string, children: React.ReactNode }) => (
  <div className="tabs" data-default-value={defaultValue}>{children}</div>
);

const TabsList = ({ children }: { children: React.ReactNode }) => (
  <div className="tabs-list">{children}</div>
);

const TabsTrigger = ({ value, children }: { value: string, children: React.ReactNode }) => (
  <button className="tabs-trigger" data-value={value}>{children}</button>
);

const TabsContent = ({ value, children }: { value: string, children: React.ReactNode }) => (
  <div className="tabs-content" data-value={value}>{children}</div>
);

// Mock Alert components
const Alert = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`alert ${className || ''}`}>{children}</div>
);

const AlertTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="alert-title">{children}</div>
);

const AlertDescription = ({ children }: { children: React.ReactNode }) => (
  <div className="alert-description">{children}</div>
);

// Mock Button component
const Button = ({
  children,
  onClick,
  disabled,
  className,
  variant,
  size
}: {
  children: React.ReactNode,
  onClick?: () => void,
  disabled?: boolean,
  className?: string,
  variant?: string,
  size?: string
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`button ${variant || ''} ${size || ''} ${className || ''}`}
  >
    {children}
  </button>
);

export interface DomainSetupGuideProps {
  /**
   * Domain being configured
   */
  domain: string;
  /**
   * Site slug for the site
   */
  siteSlug: string;
  /**
   * Domain verification status
   */
  verificationStatus?: 'pending' | 'verified' | 'failed';
  /**
   * Callback when verification is requested
   */
  onVerify?: () => void;
  /**
   * Is verification in progress
   */
  isVerifying?: boolean;
}

/**
 * DomainSetupGuide - Component that provides guidance for setting up a domain
 *
 * Features:
 * - Step-by-step instructions for domain configuration
 * - DNS record information with copy functionality
 * - Domain verification status and controls
 * - Tabbed interface for different domain providers
 */
export const DomainSetupGuide: React.FC<DomainSetupGuideProps> = ({
  domain,
  siteSlug,
  verificationStatus = 'pending',
  onVerify,
  isVerifying = false
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // DNS records that need to be configured
  const dnsRecords = {
    a: {
      type: 'A',
      name: '@',
      value: '76.76.21.21', // Example IP - would be replaced with actual server IP
      ttl: '3600'
    },
    cname: {
      type: 'CNAME',
      name: 'www',
      value: `${siteSlug}.mydirectory.com`,
      ttl: '3600'
    }
  };

  // Handle copy to clipboard
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Render verification status badge
  const renderStatusBadge = () => {
    switch (verificationStatus) {
      case 'verified':
        return (
          <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Verified
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm">
            <AlertTriangleIcon className="w-4 h-4 mr-1" />
            Verification Failed
          </div>
        );
      default:
        return (
          <div className="flex items-center text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm">
            <InfoIcon className="w-4 h-4 mr-1" />
            Pending Verification
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Domain Setup Guide: {domain}</h3>
        {renderStatusBadge()}
      </div>

      <Alert className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          DNS changes can take up to 48 hours to propagate. However, they often take effect within a few hours.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General Instructions</TabsTrigger>
          <TabsTrigger value="godaddy">GoDaddy</TabsTrigger>
          <TabsTrigger value="namecheap">Namecheap</TabsTrigger>
          <TabsTrigger value="cloudflare">Cloudflare</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-lg mb-2">Step 1: Access your domain provider's DNS settings</h4>
              <p className="text-gray-600">
                Log in to your domain registrar's website and navigate to the DNS management section for {domain}.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-lg mb-2">Step 2: Add the following DNS records</h4>

              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name/Host</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value/Target</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TTL</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3">{dnsRecords.a.type}</td>
                      <td className="px-4 py-3">{dnsRecords.a.name}</td>
                      <td className="px-4 py-3">{dnsRecords.a.value}</td>
                      <td className="px-4 py-3">{dnsRecords.a.ttl}</td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(dnsRecords.a.value, 'a')}
                          className="flex items-center text-blue-600"
                        >
                          <CopyIcon className="w-4 h-4 mr-1" />
                          {copiedField === 'a' ? 'Copied!' : 'Copy'}
                        </Button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">{dnsRecords.cname.type}</td>
                      <td className="px-4 py-3">{dnsRecords.cname.name}</td>
                      <td className="px-4 py-3">{dnsRecords.cname.value}</td>
                      <td className="px-4 py-3">{dnsRecords.cname.ttl}</td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(dnsRecords.cname.value, 'cname')}
                          className="flex items-center text-blue-600"
                        >
                          <CopyIcon className="w-4 h-4 mr-1" />
                          {copiedField === 'cname' ? 'Copied!' : 'Copy'}
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-lg mb-2">Step 3: Verify your domain</h4>
              <p className="text-gray-600 mb-4">
                After configuring your DNS records, click the button below to verify your domain.
                This process checks if your DNS records are correctly configured.
              </p>

              <Button
                onClick={onVerify}
                disabled={isVerifying || verificationStatus === 'verified'}
                className="flex items-center"
              >
                {isVerifying ? 'Verifying...' : 'Verify Domain'}
                {verificationStatus === 'verified' && <CheckCircleIcon className="ml-2 w-4 h-4" />}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="godaddy">
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-lg mb-2">GoDaddy-specific instructions</h4>
              <ol className="list-decimal pl-5 space-y-3">
                <li>Log in to your GoDaddy account</li>
                <li>Click on <strong>My Products</strong></li>
                <li>Find your domain and click <strong>DNS</strong></li>
                <li>In the DNS Management page, add the records shown in the table below</li>
              </ol>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name/Host</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value/Target</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TTL</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3">{dnsRecords.a.type}</td>
                    <td className="px-4 py-3">@</td>
                    <td className="px-4 py-3">{dnsRecords.a.value}</td>
                    <td className="px-4 py-3">1 Hour</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">{dnsRecords.cname.type}</td>
                    <td className="px-4 py-3">www</td>
                    <td className="px-4 py-3">{dnsRecords.cname.value}</td>
                    <td className="px-4 py-3">1 Hour</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <Button
                variant="outline"
                className="flex items-center"
                onClick={() => window.open('https://www.godaddy.com/help/manage-dns-records-680', '_blank')}
              >
                GoDaddy DNS Help
                <ExternalLinkIcon className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="namecheap">
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-lg mb-2">Namecheap-specific instructions</h4>
              <ol className="list-decimal pl-5 space-y-3">
                <li>Log in to your Namecheap account</li>
                <li>Go to <strong>Domain List</strong> and click <strong>Manage</strong> next to your domain</li>
                <li>Navigate to the <strong>Advanced DNS</strong> tab</li>
                <li>Add the records shown in the table below</li>
              </ol>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TTL</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3">{dnsRecords.a.type}</td>
                    <td className="px-4 py-3">@</td>
                    <td className="px-4 py-3">{dnsRecords.a.value}</td>
                    <td className="px-4 py-3">Automatic</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">{dnsRecords.cname.type}</td>
                    <td className="px-4 py-3">www</td>
                    <td className="px-4 py-3">{dnsRecords.cname.value}</td>
                    <td className="px-4 py-3">Automatic</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <Button
                variant="outline"
                className="flex items-center"
                onClick={() => window.open('https://www.namecheap.com/support/knowledgebase/article.aspx/434/2237/how-do-i-set-up-host-records-for-a-domain/', '_blank')}
              >
                Namecheap DNS Help
                <ExternalLinkIcon className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cloudflare">
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-lg mb-2">Cloudflare-specific instructions</h4>
              <ol className="list-decimal pl-5 space-y-3">
                <li>Log in to your Cloudflare account</li>
                <li>Select your domain from the dashboard</li>
                <li>Click on <strong>DNS</strong> in the top navigation</li>
                <li>Click <strong>Add Record</strong> and add the records shown below</li>
                <li><strong>Important:</strong> Make sure the proxy status is set to <strong>DNS only</strong> (gray cloud icon)</li>
              </ol>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proxy Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3">{dnsRecords.a.type}</td>
                    <td className="px-4 py-3">@</td>
                    <td className="px-4 py-3">{dnsRecords.a.value}</td>
                    <td className="px-4 py-3">DNS only</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">{dnsRecords.cname.type}</td>
                    <td className="px-4 py-3">www</td>
                    <td className="px-4 py-3">{dnsRecords.cname.value}</td>
                    <td className="px-4 py-3">DNS only</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <Button
                variant="outline"
                className="flex items-center"
                onClick={() => window.open('https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/', '_blank')}
              >
                Cloudflare DNS Help
                <ExternalLinkIcon className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DomainSetupGuide;
