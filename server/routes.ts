import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Products Routes
  app.get("/api/products", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const categoryId = req.query.categoryId as string;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) || 'desc';
      
      // Enhanced filtering parameters with validation
      const categoryIds = req.query.categoryIds as string | string[];
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
      const minStock = req.query.minStock ? parseInt(req.query.minStock as string) : undefined;
      const maxStock = req.query.maxStock ? parseInt(req.query.maxStock as string) : undefined;

      // Validate price range
      if (minPrice !== undefined && (isNaN(minPrice) || minPrice < 0)) {
        return res.status(400).json({ message: "Invalid minPrice value" });
      }
      if (maxPrice !== undefined && (isNaN(maxPrice) || maxPrice < 0)) {
        return res.status(400).json({ message: "Invalid maxPrice value" });
      }
      if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
        return res.status(400).json({ message: "minPrice cannot be greater than maxPrice" });
      }

      // Validate stock range
      if (minStock !== undefined && (isNaN(minStock) || minStock < 0)) {
        return res.status(400).json({ message: "Invalid minStock value" });
      }
      if (maxStock !== undefined && (isNaN(maxStock) || maxStock < 0)) {
        return res.status(400).json({ message: "Invalid maxStock value" });
      }
      if (minStock !== undefined && maxStock !== undefined && minStock > maxStock) {
        return res.status(400).json({ message: "minStock cannot be greater than maxStock" });
      }

      // Handle categoryIds - can be a single string or array
      let categoryIdsArray: string[] | undefined;
      if (categoryIds) {
        if (Array.isArray(categoryIds)) {
          categoryIdsArray = categoryIds.filter(id => id && id.trim() !== '');
        } else if (categoryIds.includes(',')) {
          categoryIdsArray = categoryIds.split(',').map(id => id.trim()).filter(id => id !== '');
        } else if (categoryIds.trim() !== '') {
          categoryIdsArray = [categoryIds.trim()];
        }
      }

      const result = await storage.getProducts({
        page,
        limit,
        search,
        categoryId,
        categoryIds: categoryIdsArray,
        minPrice,
        maxPrice,
        minStock,
        maxStock,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      res.json(result);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const { categoryIds, ...productData } = req.body;
      
      const validatedProduct = insertProductSchema.parse(productData);
      const categoryIdsArray = Array.isArray(categoryIds) ? categoryIds : [];

      const product = await storage.createProduct(validatedProduct, categoryIdsArray);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error('Error creating product:', error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const { categoryIds, ...productData } = req.body;
      
      const validatedProduct = insertProductSchema.partial().parse(productData);
      const categoryIdsArray = Array.isArray(categoryIds) ? categoryIds : undefined;

      const product = await storage.updateProduct(req.params.id, validatedProduct, categoryIdsArray);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error('Error updating product:', error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Categories Routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedCategory = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedCategory);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error('Error creating category:', error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const validatedCategory = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedCategory);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error('Error updating category:', error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
