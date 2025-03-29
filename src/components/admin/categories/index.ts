// Standard barrel file exports for CategoryTable
export * from './CategoryTable';
export { default as CategoryTable } from './CategoryTable';
export { default } from './CategoryTable';

// Export the CategoryForm component if it exists
try {
  // Export from CategoryForm.tsx
  const categoryForm = require('./CategoryForm');
  export const CategoryForm = categoryForm.default || categoryForm.CategoryForm;
} catch (e) {
  console.warn('CategoryForm component not found, skipping export');
}
