"use client";

import React, { useState } from 'react';
import { RoleWizardSteps } from './RoleWizardSteps';
import { RoleBasicInfoStep } from './steps/RoleBasicInfoStep';
import { RolePermissionsStep } from './steps/RolePermissionsStep';
import { RoleInheritanceStep } from './steps/RoleInheritanceStep';
import { RoleSummaryStep } from './steps/RoleSummaryStep';
import { RoleWizardNavigation } from './RoleWizardNavigation';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Role, RoleScope } from '@/types/role';

export interface WizardData {
  basicInfo: {
    name: string;
    description: string;
    scope: RoleScope;
    siteId?: string;
  };
  permissions: Record<string, string[]>;
  inheritance: {
    parentRoles: Role[];
  };
}

export function RoleWizardContainer() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    basicInfo: {
      name: '',
      description: '',
      scope: 'tenant',
      siteId: ''
    },
    permissions: {},
    inheritance: {
      parentRoles: []
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 4;
  
  const updateWizardData = (stepName: keyof WizardData, data: any) => {
    setWizardData(prev => ({
      ...prev,
      [stepName]: {
        ...prev[stepName],
        ...data
      }
    }));
  };
  
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleFinish = async () => {
    try {
      setIsSubmitting(true);
      
      // Create role API call
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...wizardData.basicInfo,
          permissions: Object.entries(wizardData.permissions).map(([resource, actions]) => ({
            resource,
            actions
          })),
          parentRoleIds: wizardData.inheritance.parentRoles.map(r => r.id)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create role');
      }
      
      const data = await response.json();
      
      toast({
        title: "Role created successfully",
        description: `The role "${wizardData.basicInfo.name}" has been created.`,
        variant: "success"
      });
      
      // Navigate to the new role's permissions page
      router.push(`/admin/roles/${data.role.id}/permissions`);
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: "Failed to create role",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isStepValid = () => {
    switch (currentStep) {
      case 1: // Basic Info
        return !!wizardData.basicInfo.name && 
               !!wizardData.basicInfo.description &&
               (wizardData.basicInfo.scope !== 'site' || !!wizardData.basicInfo.siteId);
      case 2: // Permissions
        return Object.keys(wizardData.permissions).length > 0;
      case 3: // Inheritance
        return true; // Optional step
      case 4: // Summary
        return true; // Just review
      default:
        return false;
    }
  };
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <RoleBasicInfoStep 
            data={wizardData.basicInfo} 
            onUpdate={(data) => updateWizardData('basicInfo', data)} 
          />
        );
      case 2:
        return (
          <RolePermissionsStep 
            data={wizardData.permissions} 
            onUpdate={(data) => updateWizardData('permissions', data)} 
            scope={wizardData.basicInfo.scope}
            siteId={wizardData.basicInfo.siteId}
          />
        );
      case 3:
        return (
          <RoleInheritanceStep 
            data={wizardData.inheritance} 
            onUpdate={(data) => updateWizardData('inheritance', data)} 
            scope={wizardData.basicInfo.scope}
            siteId={wizardData.basicInfo.siteId}
          />
        );
      case 4:
        return (
          <RoleSummaryStep 
            data={wizardData} 
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <RoleWizardSteps 
        currentStep={currentStep} 
        totalSteps={totalSteps} 
      />
      
      <div className="p-6 bg-white rounded-md shadow">
        {renderStep()}
      </div>
      
      <RoleWizardNavigation 
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={handleBack}
        onNext={handleNext}
        onFinish={handleFinish}
        isNextDisabled={!isStepValid()}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
