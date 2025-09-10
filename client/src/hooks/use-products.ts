import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ProductWithCategories, InsertProduct } from "@shared/schema";

interface ProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
  sortBy?: string;
  sortOrder?: string;
}

interface ProductsResponse {
  products: ProductWithCategories[];
  total: number;
}

export function useProducts(params: ProductsParams) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.categoryId) queryParams.set('categoryId', params.categoryId);
  if (params.categoryIds?.length) queryParams.set('categoryIds', params.categoryIds.join(','));
  if (params.minPrice !== undefined) queryParams.set('minPrice', params.minPrice.toString());
  if (params.maxPrice !== undefined) queryParams.set('maxPrice', params.maxPrice.toString());
  if (params.minStock !== undefined) queryParams.set('minStock', params.minStock.toString());
  if (params.maxStock !== undefined) queryParams.set('maxStock', params.maxStock.toString());
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

  return useQuery<ProductsResponse>({
    queryKey: ['/api/products', queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/products?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });
}

export function useProduct(id: string) {
  return useQuery<ProductWithCategories>({
    queryKey: ['/api/products', id],
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      product, 
      categoryIds 
    }: { 
      product: InsertProduct; 
      categoryIds: string[] 
    }) => {
      const response = await apiRequest('POST', '/api/products', {
        ...product,
        categoryIds,
      });
      return response.json();
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/products'] });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueriesData({ queryKey: ['/api/products'] });

      // Optimistically update to the new value
      queryClient.setQueriesData<ProductsResponse>({ queryKey: ['/api/products'] }, (old) => {
        if (!old) return old;
        
        const optimisticProduct: ProductWithCategories = {
          id: `temp-${Date.now()}`,
          name: variables.product.name,
          description: variables.product.description || null,
          price: variables.product.price,
          stockQuantity: variables.product.stockQuantity,
          imageUrl: variables.product.imageUrl || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          categories: [], // Categories will be resolved after server response
        };

        return {
          ...old,
          products: [optimisticProduct, ...old.products],
          total: old.total + 1,
        };
      });

      return { previousProducts };
    },
    onError: (err, variables, context) => {
      // Revert the optimistic update
      if (context?.previousProducts) {
        context.previousProducts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      product, 
      categoryIds 
    }: { 
      id: string; 
      product: Partial<InsertProduct>; 
      categoryIds?: string[] 
    }) => {
      const response = await apiRequest('PUT', `/api/products/${id}`, {
        ...product,
        categoryIds,
      });
      return response.json();
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['/api/products'] });
      await queryClient.cancelQueries({ queryKey: ['/api/products', variables.id] });

      const previousProducts = queryClient.getQueriesData({ queryKey: ['/api/products'] });
      const previousProduct = queryClient.getQueryData(['/api/products', variables.id]);

      // Optimistically update product in list
      queryClient.setQueriesData<ProductsResponse>({ queryKey: ['/api/products'] }, (old) => {
        if (!old) return old;
        
        return {
          ...old,
          products: old.products.map(p => 
            p.id === variables.id 
              ? { ...p, ...variables.product, updatedAt: new Date() }
              : p
          ),
        };
      });

      return { previousProducts, previousProduct };
    },
    onError: (err, variables, context) => {
      if (context?.previousProducts) {
        context.previousProducts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousProduct) {
        queryClient.setQueryData(['/api/products', variables.id], context.previousProduct);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products', variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/products/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['/api/products'] });

      const previousProducts = queryClient.getQueriesData({ queryKey: ['/api/products'] });

      // Optimistically remove product from list
      queryClient.setQueriesData<ProductsResponse>({ queryKey: ['/api/products'] }, (old) => {
        if (!old) return old;
        
        return {
          ...old,
          products: old.products.filter(p => p.id !== id),
          total: Math.max(0, old.total - 1),
        };
      });

      return { previousProducts };
    },
    onError: (err, id, context) => {
      if (context?.previousProducts) {
        context.previousProducts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });
}
