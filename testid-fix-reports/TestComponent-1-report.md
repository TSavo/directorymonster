# Test Report for TestComponent-1.patch

## Summary

- **Patch File**: testid-fix-patches\TestComponent-1.patch
- **Target File**: src/components/test/TestComponent.tsx
- **Patch Applied**: Yes
- **Changes Kept**: No
- **Reason**: Success count unchanged (0)

## Test Results

### Before Patch

- **Total Tests**: 1
- **Passed**: 0
- **Failed**: 1

### After Patch

- **Total Tests**: 1
- **Passed**: 0
- **Failed**: 1

### Detailed Results

#### tests\test\TestComponent.test.tsx

- **Before**: 0/1 passed
- **After**: 0/1 passed
- **Difference**: 0 more passing tests

## Patch Content

```diff
# Patch for src/components/test/TestComponent.tsx

--- a/src/components/test/TestComponent.tsx
+++ b/src/components/test/TestComponent.tsx
@@ -10,13 +10,16 @@ const TestComponent: React.FC<TestComponentProps> = ({
   onButtonClick 
 }) => {
   return (
-    <div className="test-component">
-      <h2>{title}</h2>
-      <p>{description}</p>
+    <div className="test-component" data-testid="test-component">
+      <h2 data-testid="test-title">{title}</h2>
+      <p data-testid="test-description">{description}</p>
       <button 
         className="test-button"
         onClick={onButtonClick}
+        data-testid="test-button"
       >
         Click Me
       </button>
     </div>
   );
 };

```
