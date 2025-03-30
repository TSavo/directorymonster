// Standardized barrel file for category hooks

// Export all named exports from hooks
export * from './useCategories';
export * from './useCategoryTable';

// Export default as named export
export { default as useCategories } from './useCategories';
export { default as useCategoryTable } from './useCategoryTable';

// Default export
export default { useCategories, useCategoryTable };
