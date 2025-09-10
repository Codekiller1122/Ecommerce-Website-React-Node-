import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Edit2, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { useDeleteProduct } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ProductWithCategories } from "@shared/schema";

interface ProductTableProps {
  data: { products: ProductWithCategories[]; total: number } | undefined;
  isLoading: boolean;
  onEdit: (product: ProductWithCategories) => void;
  filters: any;
  onFiltersChange: (filters: any) => void;
}

export default function ProductTable({ 
  data, 
  isLoading, 
  onEdit, 
  filters, 
  onFiltersChange 
}: ProductTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductWithCategories | null>(null);
  const { toast } = useToast();
  const deleteProductMutation = useDeleteProduct();

  const handleDeleteClick = (product: ProductWithCategories) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    
    try {
      await deleteProductMutation.mutateAsync(productToDelete.id);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (stock < 20) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  const totalPages = data ? Math.ceil(data.total / 10) : 1;

  const handlePageChange = (page: number) => {
    onFiltersChange({ ...filters, page });
  };

  return (
    <>
      <Card className="overflow-hidden" data-testid="products-table-container">
        <div className="overflow-x-auto">
          <Table data-testid="products-table">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Product</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-md" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : data && data.products.length > 0 ? (
                data.products.map((product) => {
                  const stockStatus = getStockStatus(product.stockQuantity);
                  return (
                    <TableRow 
                      key={product.id} 
                      className="hover:bg-muted/50 transition-colors"
                      data-testid={`product-row-${product.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-10 h-10 rounded-md object-cover border border-border"
                              data-testid={`product-image-${product.id}`}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-muted border border-border flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">No Image</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium" data-testid={`product-name-${product.id}`}>
                              {product.name}
                            </p>
                            {product.description && (
                              <p 
                                className="text-sm text-muted-foreground truncate max-w-xs"
                                data-testid={`product-description-${product.id}`}
                              >
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1" data-testid={`product-categories-${product.id}`}>
                          {product.categories.length > 0 ? (
                            product.categories.map((category) => (
                              <Badge 
                                key={category.id} 
                                variant="secondary"
                                data-testid={`category-badge-${category.id}`}
                              >
                                {category.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No categories</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium" data-testid={`product-price-${product.id}`}>
                          ${parseFloat(product.price).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm" data-testid={`product-stock-${product.id}`}>
                          {product.stockQuantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={stockStatus.variant}
                          data-testid={`product-status-${product.id}`}
                        >
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(product)}
                            data-testid={`button-edit-product-${product.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(product)}
                            data-testid={`button-delete-product-${product.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground" data-testid="empty-products">
                    No products found. Add your first product to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {data && data.total > 0 && (
          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground" data-testid="pagination-info">
                Showing {((filters.page - 1) * 10) + 1} to {Math.min(filters.page * 10, data.total)} of {data.total} results
              </div>
              
              <Pagination
                currentPage={filters.page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                data-testid="products-pagination"
              />
            </div>
          </div>
        )}
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-product-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
