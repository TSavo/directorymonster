// Standardized barrel file for category hooks

// Import hooks
import useCategories from './useCategories';
import useCategoryTable from './useCategoryTable';

// Export all named exports from hooks
export * from './useCategories';
export * from './useCategoryTable';

// Export default as named export
export { useCategories };
export { useCategoryTable };

// Default export
export default { useCategories, useCategoryTable };
