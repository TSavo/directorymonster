# Diff for tests\LinkUtilities.test.tsx

## Missing data-testid attributes
- `test-link`

## Component Files
- src\components\LinkUtilities.tsx

## Generated Diff
<think>
Okay, I need to figure out why the tests are failing due to missing data-testid attributes in the components. Let me start by looking at the provided files.

In the test file, there's a test for CategoryLink and ListingLinkWithCategory. Both of these components accept an additional prop called data-testid. For example, in CategoryLink, they pass data-testid="test-link". The test then looks for this attribute to ensure it's set correctly.

Looking at the Link component from Next.js (imported as Link), I don't see any default data-testid attributes being passed. That means if a user passes data-testid, it won't be present by default because the component doesn't receive it.

So, the problem is that the components aren't forwarding the data-testid prop to their underlying Link elements. To fix this, I should modify both CategoryLink and ListingLink to include the data-testid prop when rendering the Link.

For CategoryLink, in its function definition, I'll add data-testid={props[data-testid]} so it passes whatever value was passed from outside. Similarly, for ListingLinkWithCategory, which is a separate component that also expects data-testid, I'll do the same.

This way, whenever these components are used and the prop is provided, it will be forwarded to the Link, ensuring the test can find them. Alternatively, if we couldn't update the components, we could look into modifying the test to use existing attributes, but forwarding the prop seems more robust.
</think>

To fix the issue with missing `data-testid` attributes in the Link component, we need to ensure these attributes are properly forwarded from the parent components.

```diff
--- a/src/components/LinkUtilities.tsx
+++ b/src/components/LinkUtilities.tsx
@@ -25,7 +25,8 @@ function CategoryLink({ category, className, children, ...props }: CategoryLinkProps) {
   return (
     <Link 
-      href={generateCategoryHref(category.slug)}
+      href={generateCategoryHref(category.slug)}
       className={className}
-      {...props}
+      data-testid={{ prop[data-testid] }}
+      className={className}
+      {...props without {data-testid}}
    >
      {children}
```

```diff
--- a/src/components/LinkUtilities.tsx
+++ b/src/components/LinkUtilities.tsx
@@ -25,7 +25,8 @@ function ListingLinkWithCategory({ categorySlug, listingSlug, className, children, ...p
   return (
     <Link 
-      href={generateListingHref(categorySlug, listingSlug)}
+      href={generateListingHref(categorySlug, listingSlug)}
       className={className}
-      {...props}
+      data-testid={{ prop[data-testid] }}
+      className={className}
+      {...props without {data-testid}}
    >
      {children}
```

## IMPORTANT: Manual Review Required
This diff is a suggestion only. Please review it carefully before applying any changes.
To apply these changes:
1. Review each file change to ensure it makes sense
2. Apply the changes manually or use a patch tool
3. Run the tests to verify the changes fixed the issue

DO NOT apply these changes automatically without review.
