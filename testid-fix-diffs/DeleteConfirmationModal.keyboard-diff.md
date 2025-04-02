# Diff for tests\admin\sites\table\DeleteConfirmationModal.keyboard.test.tsx

## Missing data-testid attributes
- `delete-modal-cancel`
- `delete-modal-confirm`

## Component Files
- src/components/admin/sites/table/DeleteConfirmationModal.tsx

## Generated Diff
<think>
Okay, so I have this problem where a test is failing because it can't find two specific data-testid attributes in the component: delete-modal-cancel and delete-modal-confirm. The task is to fix this issue by either adding these attributes to the component or updating the test.

Looking at the provided code, I see that there's a DeleteConfirmationModal component. It has some buttons with onClick handlers but no mention of data-testid attributes. The test is looking for those attributes which don't exist here, so that's why it's failing.

I need to check where these data-testid values should come from. Since the test expects them, perhaps they were used before when certain elements were added. Maybe in another version of the component or a related file.

Wait, maybe the buttons are part of an animation or some other feature. Let me think about what those buttons represent. The 'Delete' button is likely for deleting the site, so it might make sense to have delete-modal-confirm as its data-testid. Similarly, if there's a cancel button with different styling, perhaps it uses delete-modal-cancel.

So I should add these data-testid attributes to both buttons in the component. For each button, adding the attribute would resolve the test issue because now the test can find them.

I'll go through each button and add the respective data-testid. The 'Delete' button will have "delete-modal-confirm", and the 'Cancel' button might already have one or a similar name, but perhaps it's better to check. Wait, looking at the original code, both buttons are defined with onClick handlers but no data-testid until now.

Therefore, adding these attributes directly in the component where the buttons are defined should fix the problem without needing changes elsewhere.
</think>

To resolve the issue, we need to add the missing `data-testid` attributes to the relevant buttons within the `DeleteConfirmationModal` component. This will allow the test to find the expected data-testid values.

Here's the diff that adds these attributes:

```diff
--- a/src/components/DeleteConfirmationModal.tsx
+++ b/src/components/DeleteConfirmationModal.tsx
@@ -61,9 +61,13 @@ const DeleteConfirmationModal = ({ siteName }: { siteName: string }) => {
               className="text-lg leading-6 font-medium text-gray-900" 
               id="modal-title"
               data-testid="modal-title"
             >
               Delete Site
             </h3>
             <div className="mt-2">
               <p className="text-sm text-gray-500">
                 Are you sure you want to delete <span className="font-semibold">{siteName}</span>? This action cannot be undone.
               </p>
             </div>
           </div>
           <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
             <button
@@ -71,8 +75,9 @@ const DeleteConfirmationModal = ({ siteName }: { siteName: string }) => {
               onClick={onConfirm}
               disabled={isLoading}
               data-testid="delete-modal-confirm"
             >
               Deleting...
             </svg>
             Deleting...
           </button>
           <button
@@ -83,7 +88,8 @@ const DeleteConfirmationModal = ({ siteName }: { siteName: string }) => {
               onClick={onCancel}
               ref={cancelButtonRef}
               disabled={isLoading}
-              data-testid="cancel-delete-button"
+              data-testid="delete-modal-cancel"
             >
               Cancel
             </button>
```

## IMPORTANT: Manual Review Required
This diff is a suggestion only. Please review it carefully before applying any changes.
To apply these changes:
1. Review each file change to ensure it makes sense
2. Apply the changes manually or use a patch tool
3. Run the tests to verify the changes fixed the issue

DO NOT apply these changes automatically without review.
