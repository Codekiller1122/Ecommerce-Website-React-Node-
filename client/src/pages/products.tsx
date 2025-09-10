import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProductTable from "@/components/products/product-table";
import ProductModal from "@/components/products/product-modal";
import FiltersBar from "@/components/products/filters-bar";
import { useProducts } from "@/hooks/use-products";

export default function Products() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
    page: 1,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
  });

  const { data, isLoading } = useProducts(filters);

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <>
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-muted-foreground">Manage your product catalog</p>
          </div>
          <Button onClick={handleAdd} className="gap-2" data-testid="button-add-product">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <FiltersBar 
          filters={filters} 
          onFiltersChange={setFilters}
          data-testid="filters-bar"
        />
        
        <ProductTable
          data={data}
          isLoading={isLoading}
          onEdit={handleEdit}
          filters={filters}
          onFiltersChange={setFilters}
          data-testid="product-table"
        />
      </div>

      <ProductModal
        open={isModalOpen}
        onClose={handleCloseModal}
        product={editingProduct}
        data-testid="product-modal"
      />
    </>
  );
}
