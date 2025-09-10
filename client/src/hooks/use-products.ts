import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ProductWithCategories, InsertProduct } from "@shared/schema";

interface ProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });
}
