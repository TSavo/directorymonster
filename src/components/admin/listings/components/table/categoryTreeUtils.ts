import { Category } from '@/components/admin/listings/types';

/**
 * Builds a hierarchical tree structure from a flat list of categories
 */
export const buildCategoryTree = (categories: Category[] | undefined | null, parentId: string | null = null): Category[] => {
  if (!categories || !Array.isArray(categories)) {
    return [];
  }
  
  return categories
    .filter(category => category.parentId === parentId)
    .map(category => ({
      ...category,
      children: buildCategoryTree(categories, category.id)
    }));
};

/**
 * Gets all descendant category IDs for a given category
 */
export const getDescendantIds = (categories: Category[], categoryId: string): string[] => {
  const directChildren = categories.filter(c => c.parentId === categoryId);
  const childrenIds = directChildren.map(c => c.id);

  const descendantIds = [...childrenIds];
  childrenIds.forEach(childId => {
    descendantIds.push(...getDescendantIds(categories, childId));
  });

  return descendantIds;
};

/**
 * Finds a category by ID
 */
export const getCategoryById = (categories: Category[], categoryId: string): Category | undefined => {
  return categories.find(c => c.id === categoryId);
};

/**
 * Gets the name of a category by ID
 */
export const getCategoryName = (categories: Category[], categoryId: string): string => {
  const category = getCategoryById(categories, categoryId);
  return category?.name || '';
};
