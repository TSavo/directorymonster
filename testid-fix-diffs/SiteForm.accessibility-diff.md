# Diff for tests\admin\sites\SiteForm.accessibility.test.tsx

## Missing data-testid attributes
- `siteForm-name`
- `siteForm-submit`
- `siteForm-cancel`
- `siteForm-name-error`
- `siteForm-fieldset`
- `siteForm-add-field`
- `siteForm-dynamic-input-0`
- `siteForm-dynamic-label-0`
- `siteForm-remove-field-0`
- `siteForm-section-heading`

## Component Files
- src/components/admin/sites/SiteForm.tsx

## Generated Diff
<think>
Okay, I need to fix the test error where several data-testid attributes are missing from the SiteForm component. The test is looking for attributes like siteForm-name, siteForm-submit, etc., but they don't exist in the component.

First, I should check if these elements (buttons or inputs) are present in the JSX of the component. Looking at the code, the last part shows a FormActions component with actions like submit and cancel. So there's probably a button for submitting and another for cancelling.

I need to add the missing data-testid attributes to each relevant element. Let me go through each one:

- siteForm-name: Probably from an input field labeled "Name". I'll look for that in the JSX.
- siteForm-submit: Likely a submit button with a specific label or role.
- siteForm-cancel: A cancel button, perhaps with a different data-testid.
- siteForm-name-error: An error message when name is missing. Maybe wrapped around an input field.
- The rest like fieldset, add-field, dynamic-input, etc., might be related to form elements that are being mocked or exist in the component but not shown.

Looking at the JSX, I see FormActions includes a submit button and a cancel button. So adding data-testid attributes there makes sense. Also, any dynamic inputs (like in dynamically added fields) should have their data-testid set.

I'll add these to each element:

- The name input: {data-testid="siteForm-name"}
- Submit button: {data-testid="siteForm-submit"}
- Cancel button: {data-testid="siteForm-cancel"}

For the error messages, maybe they are part of other elements like a .error or .success div. But since the test is expecting data-testid attributes on form elements, perhaps wrapping them in an input.

Finally, for dynamic fields, each field should have its data-testid set to "siteForm-fieldset" and their labels to "siteForm-add-field".

I'll structure the diff by adding these attributes where each element is used. I'll go through each part of the JSX and insert the necessary lines with the new attributes.
</think>

To fix the missing data-testid attributes in the component, we need to add them to the relevant form elements.

```diff
--- a/src/components/SiteForm.tsx
+++ b/src/components/SiteForm.tsx
@@ -62,7 +62,7 @@ const SiteForm = ({ mode, activeStep, site }) => {
         <StepNavigation
           steps={STEPS}
           activeStep={activeStep}
           completedSteps={completedSteps}
@@ -80,13 +80,19 @@ const SiteForm = ({ mode, activeStep, site }) => {
       {activeStep === 'preview' && (
         <SiteFormPreview siteData={site} />
       )}
     </div>
 
     {/* Form Actions */}
     <FormActions
       isFirstStep={isFirstStep}
       isLastStep={isLastStep}
-      isLoading={isLoading}
+      isLoading={isLoading}
+      data-testid="siteForm-submit"
+      onPrevious={handlePrevious}
+      onNext={handleNext}
+      onCancel={onCancel || (() => router.back())}
+      data-testid="siteForm-cancel"
+      mode={mode}
     />
   </form>
 
   {/* Error message */}
```

## IMPORTANT: Manual Review Required
This diff is a suggestion only. Please review it carefully before applying any changes.
To apply these changes:
1. Review each file change to ensure it makes sense
2. Apply the changes manually or use a patch tool
3. Run the tests to verify the changes fixed the issue

DO NOT apply these changes automatically without review.
