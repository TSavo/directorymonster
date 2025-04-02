# Diff for tests\admin\categories\components\CategoryTableSortHeader.test.tsx

## Missing data-testid attributes
- `sort-label-name`
- `sort-icon-name`
- `sort-button-name`
- `sort-header-name`

## Component Files
- src\components\admin\categories\components\CategoryTableSortHeader.tsx

## Generated Diff
<think>
Okay, I have a problem where my tests for the CategoryTableSortHeader component are failing because they can't find certain data-testid attributes that don't exist in the component. The missing ones are sort-label-name, sort-icon-name, sort-button-name, and sort-header-name.

First, I need to figure out why these data-testid attributes aren't present. Let me look at the component file. Oh, right! In the component code, each part like the button, span, and ArrowUpDown have their own data-testid props set. So maybe in the tests, these attributes were supposed to be on those specific elements but are instead looking for a general category name.

Wait, no. The test is expecting a single data-testid attribute called sort-header-name or similar, but in reality, each element (header, button, label, icon) has its own unique data-testid. So the tests should target these individual elements instead of a generic one.

But since I can only modify the component to add these attributes, maybe adding them will help. Let me check where these attributes are missing.

Looking at the test code:

- sort-header-name is assigned to th's data-testid.
- sort-button-name is used for the button's data-testid.
- sort-label-name for the span.
- sort-icon-name for the ArrowUpDown.

But in the component, each part has its own data-testid. So perhaps the tests should be updated to target these specific elements with their respective data-testid attributes. However, since the user prefers adding missing attributes to the component instead of changing the test, I'll proceed accordingly.

In the component, I need to create a new data-testid for each element: header, button, label, icon, and maybe others like sort-label-field or sort-icon-field.

So in the CategoryTableSortHeader component, each part should have its own data-testid prop. For example, the th should have sort-header-{field}, the button sort-button-{field}, span sort-label-{field}, and ArrowUpDown sort-icon-{field}.

I'll modify the component to assign these data-testid attributes. That way, when the tests run, they can find them as expected.

Now, I'll create a diff that adds these data-testid properties in the component. Each element (th, button, span, ArrowUpDown) will have their respective data-testid set based on {field}.
</think>

To fix the issue, we need to add the missing `data-testid` attributes to each part of the `CategoryTableSortHeader` component so that they match what the tests are expecting.

```diff
--- a/src/components/admin/categories/components/RelsTagTableSortHeader.tsx
+++ b/src/components/admin/categories/components/RelsTagTableSortHeader.tsx
@@ -1,4 +1,20 @@
 import { ArrowUp } from 'lucide-react';
+import { ArrowUp } from 'lucide-react',
   // ... other imports remain the same ...
+
+const sortLabelData-testid = new NodeJS.Timeout(() => `sort-label-${field}`);
+const sortIconData-testid = new NodeJS.Timeout(() => `sort-icon-${field}`);
+const sortHeaderData-testid = new NodeJS.Timeout(() => `sort-header-${field}`);
+const sortButtonData-testid = new NodeJS.Timeout(() => `sort-button-${field}`);
+
 return (
   <th 
     scope="col" 
@@ -35,6 +51,8 @@
       aria-label={ariaLabel}
       data-testid={sortButtonData-testid}
     >
       <span data-testid={sortLabelData-testid}>{label}</span>
+      <ArrowUp size={14} className={isActive ? 'text-blue-500' : 'text-gray-400'} 
+        aria-hidden="true" data-testid={sortIconData-testid} />
     </button>
   </th>
 )
```

## IMPORTANT: Manual Review Required
This diff is a suggestion only. Please review it carefully before applying any changes.
To apply these changes:
1. Review each file change to ensure it makes sense
2. Apply the changes manually or use a patch tool
3. Run the tests to verify the changes fixed the issue

DO NOT apply these changes automatically without review.
