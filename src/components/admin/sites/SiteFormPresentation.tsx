'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  BasicInfoStep,
  DomainStep,
  ThemeStep,
  SEOStep,
  SiteFormPreview,
  StepNavigation,
  FormActions
} from './components';
import { STEPS, UseSiteFormReturn } from './hooks/useSiteForm';

export interface SiteFormPresentationProps extends UseSiteFormReturn {
  mode: 'create' | 'edit';
  onCancel?: () => void;
}

export function SiteFormPresentation({
  // State
  activeStep,
  completedSteps,
  newDomain,
  isFirstStep,
  isLastStep,
  
  // Site data and operations
  site,
  isLoading,
  error,
  success,
  errors,
  
  // Handlers
  handleChange,
  handleStepChange,
  handleNext,
  handlePrevious,
  handleSubmit,
  addDomain,
  removeDomain,
  
  // Props
  mode,
  onCancel
}: SiteFormPresentationProps) {
  const router = useRouter();

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded shadow" data-testid="site-form">
      <h1
        id="siteForm-header"
        className="text-xl font-bold mb-6"
        data-testid="siteForm-header"
      >
        {mode === 'edit' ? 'Edit' : 'Create'} Site
      </h1>

      {/* Error message */}
      {error && (
        <div
          className="mb-4 p-3 bg-red-100 text-red-700 rounded"
          role="alert"
          data-testid="siteForm-error"
        >
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div
          className="mb-4 p-3 bg-green-100 text-green-700 rounded"
          role="alert"
          data-testid="siteForm-success"
        >
          {success}
        </div>
      )}

      {/* Step Navigation */}
      <StepNavigation
        steps={STEPS}
        activeStep={activeStep}
        completedSteps={completedSteps}
        onStepChange={handleStepChange}
        isLoading={isLoading}
      />

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        role="form"
        aria-labelledby="siteForm-header"
        data-testid="siteForm-form"
      >
        {/* Step Content */}
        <div className="mb-6" data-testid="step-content">
          {activeStep === 'basic_info' && (
            <BasicInfoStep
              values={{
                name: site.name,
                slug: site.slug,
                description: site.description || ''
              }}
              errors={{
                name: errors.name,
                slug: errors.slug,
                description: errors.description
              }}
              onChange={handleChange}
              isLoading={isLoading}
            />
          )}

          {activeStep === 'domains' && (
            <DomainStep
              domains={site.domains}
              newDomain={newDomain}
              errors={{
                domains: errors.domains,
                newDomain: errors.newDomain
              }}
              onChange={handleChange}
              onAdd={addDomain}
              onRemove={removeDomain}
              isLoading={isLoading}
            />
          )}

          {activeStep === 'theme' && (
            <ThemeStep
              values={{
                theme: site.theme,
                customStyles: site.customStyles || ''
              }}
              errors={{
                theme: errors.theme,
                customStyles: errors.customStyles
              }}
              onChange={handleChange}
              isLoading={isLoading}
            />
          )}

          {activeStep === 'seo' && (
            <SEOStep
              values={{
                seoTitle: site.seoTitle || '',
                seoDescription: site.seoDescription || '',
                seoKeywords: site.seoKeywords || '',
                enableCanonicalUrls: site.enableCanonicalUrls || false
              }}
              errors={{
                seoTitle: errors.seoTitle,
                seoDescription: errors.seoDescription,
                seoKeywords: errors.seoKeywords
              }}
              onChange={handleChange}
              isLoading={isLoading}
            />
          )}

          {activeStep === 'preview' && (
            <SiteFormPreview siteData={site} />
          )}
        </div>

        {/* Form Actions */}
        <FormActions
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          isLoading={isLoading}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onCancel={onCancel || (() => router.back())}
          mode={mode}
        />
      </form>
    </div>
  );
}

export default SiteFormPresentation;
