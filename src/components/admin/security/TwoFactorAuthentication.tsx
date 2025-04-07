'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  fetchTwoFactorSettings, 
  enableTwoFactor, 
  verifyTwoFactor, 
  disableTwoFactor 
} from '../../../services/securityService';
import { TwoFactorSettings, TwoFactorMethod } from '../../../types/security';
import { formatDistanceToNow } from 'date-fns';

interface TwoFactorAuthenticationProps {
  userId?: string;
}

export const TwoFactorAuthentication: React.FC<TwoFactorAuthenticationProps> = ({ userId }) => {
  const [settings, setSettings] = useState<TwoFactorSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Setup dialogs
  const [showSetupDialog, setShowSetupDialog] = useState<boolean>(false);
  const [setupMethod, setSetupMethod] = useState<'app' | 'sms' | 'email' | 'security_key'>('app');
  const [setupDetails, setSetupDetails] = useState<{ secret?: string; qrCode?: string }>({});
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [methodName, setMethodName] = useState<string>('');
  
  // Confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [methodToDisable, setMethodToDisable] = useState<string | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchTwoFactorSettings(userId);
      setSettings(data);
    } catch (err) {
      console.error('Error fetching two-factor settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch two-factor settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [userId]);

  const handleEnableTwoFactor = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare details based on method
      const details: Record<string, any> = { name: methodName };
      
      if (setupMethod === 'sms') {
        details.phoneNumber = phoneNumber;
      } else if (setupMethod === 'email') {
        details.email = emailAddress;
      }
      
      const response = await enableTwoFactor(setupMethod, details);
      setSetupDetails(response);
      
      // Don't close dialog yet, we need to verify
    } catch (err) {
      console.error('Error enabling two-factor authentication:', err);
      setError(err instanceof Error ? err.message : 'Failed to enable two-factor authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTwoFactor = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await verifyTwoFactor(setupMethod, verificationCode);
      
      // Close dialog and refresh settings
      setShowSetupDialog(false);
      setSuccess('Two-factor authentication method added successfully');
      fetchSettings();
      
      // Reset form
      setVerificationCode('');
      setPhoneNumber('');
      setEmailAddress('');
      setMethodName('');
      setSetupDetails({});
    } catch (err) {
      console.error('Error verifying two-factor authentication:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify two-factor authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!methodToDisable) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await disableTwoFactor(methodToDisable);
      
      // Close dialog and refresh settings
      setShowConfirmDialog(false);
      setMethodToDisable(null);
      setSuccess('Two-factor authentication method removed successfully');
      fetchSettings();
    } catch (err) {
      console.error('Error disabling two-factor authentication:', err);
      setError(err instanceof Error ? err.message : 'Failed to disable two-factor authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodIcon = (method: TwoFactorMethod) => {
    switch (method.type) {
      case 'app':
        return '📱';
      case 'sms':
        return '💬';
      case 'email':
        return '✉️';
      case 'security_key':
        return '🔑';
      default:
        return '🔒';
    }
  };

  const getMethodDescription = (method: TwoFactorMethod) => {
    switch (method.type) {
      case 'app':
        return 'Authenticator App';
      case 'sms':
        return 'SMS Text Message';
      case 'email':
        return 'Email';
      case 'security_key':
        return 'Security Key';
      default:
        return method.type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Secure your account with two-factor authentication
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && !settings ? (
          <div className="text-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading two-factor authentication settings...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : success ? (
          <Alert variant="success" className="mb-4">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        ) : null}

        {settings && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">
                  {settings.enabled 
                    ? 'Two-factor authentication is enabled' 
                    : 'Two-factor authentication is disabled'}
                </p>
              </div>
              <Switch 
                checked={settings.enabled} 
                disabled={!settings.methods.length || isLoading}
                onCheckedChange={(checked) => {
                  // This would typically update a server setting
                  setSettings(prev => prev ? { ...prev, enabled: checked } : null);
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Authentication Methods</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSetupDialog(true)}
                >
                  Add Method
                </Button>
              </div>

              {settings.methods.length === 0 ? (
                <div className="text-center py-4 border rounded-md bg-gray-50">
                  <p className="text-gray-500">No authentication methods configured</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setShowSetupDialog(true)}
                  >
                    Add Method
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {settings.methods.map((method) => (
                    <div 
                      key={method.id} 
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getMethodIcon(method)}</div>
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-gray-500">
                            {getMethodDescription(method)}
                            {method.lastUsedAt && (
                              <span className="ml-2">
                                • Last used {formatDistanceToNow(new Date(method.lastUsedAt), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setMethodToDisable(method.id);
                          setShowConfirmDialog(true);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Security Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Require for Login</div>
                    <div className="text-sm text-gray-500">
                      Require two-factor authentication for all logins
                    </div>
                  </div>
                  <Switch 
                    checked={settings.requiredForLogin} 
                    disabled={!settings.enabled || isLoading}
                    onCheckedChange={(checked) => {
                      setSettings(prev => prev ? { ...prev, requiredForLogin: checked } : null);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Require for Sensitive Actions</div>
                    <div className="text-sm text-gray-500">
                      Require two-factor authentication for sensitive actions like changing passwords
                    </div>
                  </div>
                  <Switch 
                    checked={settings.requiredForSensitiveActions} 
                    disabled={!settings.enabled || isLoading}
                    onCheckedChange={(checked) => {
                      setSettings(prev => prev ? { ...prev, requiredForSensitiveActions: checked } : null);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Setup Dialog */}
        <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Two-Factor Authentication Method</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {!setupDetails.secret && !setupDetails.qrCode ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="method-name">Name</Label>
                    <Input 
                      id="method-name" 
                      placeholder="e.g., My Phone, Work Email" 
                      value={methodName}
                      onChange={(e) => setMethodName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="method-type">Method</Label>
                    <Select value={setupMethod} onValueChange={(value: any) => setSetupMethod(value)}>
                      <SelectTrigger id="method-type">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="app">Authenticator App</SelectItem>
                        <SelectItem value="sms">SMS Text Message</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="security_key">Security Key</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {setupMethod === 'sms' && (
                    <div className="space-y-2">
                      <Label htmlFor="phone-number">Phone Number</Label>
                      <Input 
                        id="phone-number" 
                        placeholder="+1 (555) 123-4567" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  )}
                  
                  {setupMethod === 'email' && (
                    <div className="space-y-2">
                      <Label htmlFor="email-address">Email Address</Label>
                      <Input 
                        id="email-address" 
                        placeholder="you@example.com" 
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                      />
                    </div>
                  )}
                  
                  <Button 
                    className="w-full" 
                    onClick={handleEnableTwoFactor}
                    disabled={isLoading || !methodName || (setupMethod === 'sms' && !phoneNumber) || (setupMethod === 'email' && !emailAddress)}
                  >
                    {isLoading ? 'Setting up...' : 'Continue'}
                  </Button>
                </>
              ) : (
                <>
                  {setupMethod === 'app' && setupDetails.qrCode && (
                    <div className="text-center space-y-4">
                      <p>Scan this QR code with your authenticator app</p>
                      <div className="mx-auto w-48 h-48 bg-white p-2 rounded-md">
                        <img 
                          src={setupDetails.qrCode} 
                          alt="QR Code" 
                          className="w-full h-full"
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        Or enter this code manually: <code className="bg-gray-100 p-1 rounded">{setupDetails.secret}</code>
                      </p>
                    </div>
                  )}
                  
                  {setupMethod === 'sms' && (
                    <p>We've sent a verification code to your phone number.</p>
                  )}
                  
                  {setupMethod === 'email' && (
                    <p>We've sent a verification code to your email address.</p>
                  )}
                  
                  {setupMethod === 'security_key' && (
                    <p>Connect your security key and follow the browser prompts.</p>
                  )}
                  
                  {setupMethod !== 'security_key' && (
                    <div className="space-y-2">
                      <Label htmlFor="verification-code">Verification Code</Label>
                      <Input 
                        id="verification-code" 
                        placeholder="Enter the 6-digit code" 
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                      />
                    </div>
                  )}
                  
                  <Button 
                    className="w-full" 
                    onClick={handleVerifyTwoFactor}
                    disabled={isLoading || (setupMethod !== 'security_key' && !verificationCode)}
                  >
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </Button>
                </>
              )}
              
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Authentication Method</DialogTitle>
            </DialogHeader>
            
            <p>Are you sure you want to remove this authentication method?</p>
            
            {settings?.methods.length === 1 && (
              <Alert variant="warning">
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This is your only authentication method. Removing it will disable two-factor authentication.
                </AlertDescription>
              </Alert>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowConfirmDialog(false);
                  setMethodToDisable(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDisableTwoFactor}
                disabled={isLoading}
              >
                {isLoading ? 'Removing...' : 'Remove'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TwoFactorAuthentication;
