import { Category } from "@/types";
import { CategoryService } from "../category-service";

describe("CategoryService.cacheCategories() cacheCategories method", () => {
  // Happy Path Tests
  describe("Happy Paths", () => {
    it("should return true when categories are cached successfully", async () => {
      // Arrange
      const tenantId = "tenant1";
      const siteId = "site1";
      const categories: Category[] = [
        {
          id: "cat1",
          siteId: "site1",
          tenantId: "tenant1",
          name: "Category 1",
          slug: "category-1",
          metaDescription: "Description 1",
          order: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      // Act
      const result = await CategoryService.cacheCategories(
        tenantId,
        siteId,
        categories,
      );

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for an empty categories array", async () => {
      // Arrange
      const tenantId = "tenant1";
      const siteId = "site1";
      const categories: Category[] = [];

      // Act
      const result = await CategoryService.cacheCategories(
        tenantId,
        siteId,
        categories,
      );

      // Assert
      expect(result).toBe(true);
    });
  });

  // Edge Case Tests
  describe("Edge Cases", () => {
    it("should return true when tenantId is an empty string", async () => {
      // Arrange
      const tenantId = "";
      const siteId = "site1";
      const categories: Category[] = [
        {
          id: "cat1",
          siteId: "site1",
          tenantId: "",
          name: "Category 1",
          slug: "category-1",
          metaDescription: "Description 1",
          order: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      // Act
      const result = await CategoryService.cacheCategories(
        tenantId,
        siteId,
        categories,
      );

      // Assert
      expect(result).toBe(true);
    });

    it("should return true when siteId is an empty string", async () => {
      // Arrange
      const tenantId = "tenant1";
      const siteId = "";
      const categories: Category[] = [
        {
          id: "cat1",
          siteId: "",
          tenantId: "tenant1",
          name: "Category 1",
          slug: "category-1",
          metaDescription: "Description 1",
          order: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      // Act
      const result = await CategoryService.cacheCategories(
        tenantId,
        siteId,
        categories,
      );

      // Assert
      expect(result).toBe(true);
    });

    it("should return true when categories contain a category with missing optional fields", async () => {
      // Arrange
      const tenantId = "tenant1";
      const siteId = "site1";
      const categories: Category[] = [
        {
          id: "cat1",
          siteId: "site1",
          tenantId: "tenant1",
          name: "Category 1",
          slug: "category-1",
          metaDescription: "Description 1",
          order: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "cat2",
          siteId: "site1",
          tenantId: "tenant1",
          name: "Category 2",
          slug: "category-2",
          metaDescription: "Description 2",
          order: 2,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          // parentId is optional and not provided here
        },
      ];

      // Act
      const result = await CategoryService.cacheCategories(
        tenantId,
        siteId,
        categories,
      );

      // Assert
      expect(result).toBe(true);
    });
  });
});
