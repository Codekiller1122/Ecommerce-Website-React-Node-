import { 
  users, 
  products, 
  categories, 
  productCategories,
  type User, 
  type InsertUser,
  type Product,
  type InsertProduct,
  type ProductWithCategories,
  type Category,
  type InsertCategory,
  type CategoryWithProductCount,
  type InsertProductCategory
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, sql, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Products
  getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    categoryIds?: string[];
    minPrice?: number;
    maxPrice?: number;
    minStock?: number;
    maxStock?: number;
    sortBy?: 'name' | 'price' | 'stock' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ products: ProductWithCategories[]; total: number }>;
  getProduct(id: string): Promise<ProductWithCategories | undefined>;
  createProduct(product: InsertProduct, categoryIds: string[]): Promise<ProductWithCategories>;
  updateProduct(id: string, product: Partial<InsertProduct>, categoryIds?: string[]): Promise<ProductWithCategories>;
  deleteProduct(id: string): Promise<void>;

  // Categories
  getCategories(): Promise<CategoryWithProductCount[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    categoryIds?: string[];
    minPrice?: number;
    maxPrice?: number;
    minStock?: number;
    maxStock?: number;
    sortBy?: 'name' | 'price' | 'stock' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ products: ProductWithCategories[]; total: number }> {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      categoryId, 
      categoryIds,
      minPrice,
      maxPrice,
      minStock,
      maxStock,
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = params;
    const offset = (page - 1) * limit;

    let query = db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        stockQuantity: products.stockQuantity,
        imageUrl: products.imageUrl,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products);

    let countQuery = db
      .select({ count: sql<number>`count(distinct ${products.id})` })
      .from(products);

    const conditions = [];

    if (search) {
      conditions.push(ilike(products.name, `%${search}%`));
    }

    // Price range filters
    if (minPrice !== undefined) {
      conditions.push(sql`${products.price}::numeric >= ${minPrice}`);
    }
    if (maxPrice !== undefined) {
      conditions.push(sql`${products.price}::numeric <= ${maxPrice}`);
    }

    // Stock range filters
    if (minStock !== undefined) {
      conditions.push(sql`${products.stockQuantity} >= ${minStock}`);
    }
    if (maxStock !== undefined) {
      conditions.push(sql`${products.stockQuantity} <= ${maxStock}`);
    }

    // Category filters - support both single and multiple categories
    const categoriesToFilter = categoryIds?.length ? categoryIds : (categoryId ? [categoryId] : null);
    if (categoriesToFilter && categoriesToFilter.length > 0) {
      query = query.innerJoin(productCategories, eq(products.id, productCategories.productId));
      countQuery = countQuery.innerJoin(productCategories, eq(products.id, productCategories.productId));
      
      if (categoriesToFilter.length === 1) {
        conditions.push(eq(productCategories.categoryId, categoriesToFilter[0]));
      } else {
        conditions.push(sql`${productCategories.categoryId} IN (${sql.join(categoriesToFilter.map(id => sql`${id}`), sql`, `)})`);
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
      countQuery = countQuery.where(and(...conditions));
    }

    // Add sorting
    const sortColumn = {
      name: products.name,
      price: products.price,
      stock: products.stockQuantity,
      createdAt: products.createdAt,
    }[sortBy];

    if (sortOrder === 'asc') {
      query = query.orderBy(asc(sortColumn));
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    query = query.limit(limit).offset(offset);

    const [productsResult, countResult] = await Promise.all([
      query,
      countQuery
    ]);

    // Get categories for each product
    const productsWithCategories: ProductWithCategories[] = await Promise.all(
      productsResult.map(async (product) => {
        const productCats = await db
          .select({
            id: categories.id,
            name: categories.name,
            createdAt: categories.createdAt,
          })
          .from(categories)
          .innerJoin(productCategories, eq(categories.id, productCategories.categoryId))
          .where(eq(productCategories.productId, product.id));

        return {
          ...product,
          categories: productCats,
        };
      })
    );

    return {
      products: productsWithCategories,
      total: countResult[0]?.count || 0,
    };
  }

  async getProduct(id: string): Promise<ProductWithCategories | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    
    if (!product) return undefined;

    const productCats = await db
      .select({
        id: categories.id,
        name: categories.name,
        createdAt: categories.createdAt,
      })
      .from(categories)
      .innerJoin(productCategories, eq(categories.id, productCategories.categoryId))
      .where(eq(productCategories.productId, product.id));

    return {
      ...product,
      categories: productCats,
    };
  }

  async createProduct(product: InsertProduct, categoryIds: string[]): Promise<ProductWithCategories> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();

    // Insert product-category relationships
    if (categoryIds.length > 0) {
      await db
        .insert(productCategories)
        .values(categoryIds.map(categoryId => ({
          productId: newProduct.id,
          categoryId,
        })));
    }

    return this.getProduct(newProduct.id) as Promise<ProductWithCategories>;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>, categoryIds?: string[]): Promise<ProductWithCategories> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: sql`NOW()` })
      .where(eq(products.id, id))
      .returning();

    if (categoryIds !== undefined) {
      // Remove existing category relationships
      await db
        .delete(productCategories)
        .where(eq(productCategories.productId, id));

      // Insert new relationships
      if (categoryIds.length > 0) {
        await db
          .insert(productCategories)
          .values(categoryIds.map(categoryId => ({
            productId: id,
            categoryId,
          })));
      }
    }

    return this.getProduct(id) as Promise<ProductWithCategories>;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getCategories(): Promise<CategoryWithProductCount[]> {
    const categoriesWithCount = await db
      .select({
        id: categories.id,
        name: categories.name,
        createdAt: categories.createdAt,
        productCount: sql<number>`count(${productCategories.categoryId})`,
      })
      .from(categories)
      .leftJoin(productCategories, eq(categories.id, productCategories.categoryId))
      .groupBy(categories.id)
      .orderBy(categories.name);

    return categoriesWithCount;
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }
}

export const storage = new DatabaseStorage();
