import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Category, CategoryWithProductCount, InsertCategory } from "@shared/schema";

export function useCategories() {
  return useQuery<CategoryWithProductCount[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });
}

export function useCategory(id: string) {
  return useQuery<Category>({
    queryKey: ['/api/categories', id],
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: InsertCategory) => {
      const response = await apiRequest('POST', '/api/categories', category);
      return response.json();
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['/api/categories'] });

      const previousCategories = queryClient.getQueryData(['/api/categories']);

      // Optimistically add new category
      queryClient.setQueryData<CategoryWithProductCount[]>(['/api/categories'], (old) => {
        if (!old) return old;
        
        const optimisticCategory: CategoryWithProductCount = {
          id: `temp-${Date.now()}`,
          name: variables.name,
          createdAt: new Date(),
          productCount: 0,
        };

        return [optimisticCategory, ...old];
      });

      return { previousCategories };
    },
    onError: (err, variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['/api/categories'], context.previousCategories);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      category 
    }: { 
      id: string; 
      category: Partial<InsertCategory> 
    }) => {
      const response = await apiRequest('PUT', `/api/categories/${id}`, category);
      return response.json();
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['/api/categories'] });
      await queryClient.cancelQueries({ queryKey: ['/api/categories', variables.id] });

      const previousCategories = queryClient.getQueryData(['/api/categories']);
      const previousCategory = queryClient.getQueryData(['/api/categories', variables.id]);

      // Optimistically update category in list
      queryClient.setQueryData<CategoryWithProductCount[]>(['/api/categories'], (old) => {
        if (!old) return old;
        
        return old.map(c => 
          c.id === variables.id 
            ? { ...c, ...variables.category }
            : c
        );
      });

      return { previousCategories, previousCategory };
    },
    onError: (err, variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['/api/categories'], context.previousCategories);
      }
      if (context?.previousCategory) {
        queryClient.setQueryData(['/api/categories', variables.id], context.previousCategory);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/categories/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['/api/categories'] });

      const previousCategories = queryClient.getQueryData(['/api/categories']);

      // Optimistically remove category from list
      queryClient.setQueryData<CategoryWithProductCount[]>(['/api/categories'], (old) => {
        if (!old) return old;
        return old.filter(c => c.id !== id);
      });

      return { previousCategories };
    },
    onError: (err, id, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['/api/categories'], context.previousCategories);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });
}
