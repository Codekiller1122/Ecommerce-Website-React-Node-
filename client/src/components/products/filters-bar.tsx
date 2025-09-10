import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, DollarSign, Package } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";
import { MultiSelect } from "@/components/ui/multi-select";

interface FiltersBarProps {
  filters: {
    search: string;
    categoryId: string;
    categoryIds: string[];
    minPrice?: number;
    maxPrice?: number;
    minStock?: number;
    maxStock?: number;
    page: number;
    sortBy: string;
    sortOrder: string;
  };
  onFiltersChange: (filters: any) => void;
}

export default function FiltersBar({ filters, onFiltersChange }: FiltersBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search);
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice?.toString() || "",
    max: filters.maxPrice?.toString() || "",
  });
  const [stockRange, setStockRange] = useState({
    min: filters.minStock?.toString() || "",
    max: filters.maxStock?.toString() || "",
  });
  const { data: categories } = useCategories();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ 
          ...filters, 
          search: searchValue, 
          page: 1 // Reset to first page when searching
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, filters, onFiltersChange]);

  // Debounce price range
  useEffect(() => {
    const timer = setTimeout(() => {
      const minPrice = priceRange.min ? parseFloat(priceRange.min) : undefined;
      const maxPrice = priceRange.max ? parseFloat(priceRange.max) : undefined;
      
      if (minPrice !== filters.minPrice || maxPrice !== filters.maxPrice) {
        onFiltersChange({
          ...filters,
          minPrice,
          maxPrice,
          page: 1,
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [priceRange, filters, onFiltersChange]);

  // Debounce stock range  
  useEffect(() => {
    const timer = setTimeout(() => {
      const minStock = stockRange.min ? parseInt(stockRange.min) : undefined;
      const maxStock = stockRange.max ? parseInt(stockRange.max) : undefined;
      
      if (minStock !== filters.minStock || maxStock !== filters.maxStock) {
        onFiltersChange({
          ...filters,
          minStock,
          maxStock,
          page: 1,
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [stockRange, filters, onFiltersChange]);

  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({ 
      ...filters, 
      categoryId: categoryId === "all" ? "" : categoryId, 
      page: 1 
    });
  };

  const handleMultipleCategoriesChange = (categoryIds: string[]) => {
    onFiltersChange({
      ...filters,
      categoryIds,
      categoryId: "", // Clear single category when using multiple
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setSearchValue("");
    setPriceRange({ min: "", max: "" });
    setStockRange({ min: "", max: "" });
    onFiltersChange({
      ...filters,
      search: "",
      categoryId: "",
      categoryIds: [],
      minPrice: undefined,
      maxPrice: undefined,
      minStock: undefined,
      maxStock: undefined,
      page: 1,
    });
  };

  const categoryOptions = categories?.map(cat => ({
    value: cat.id,
    label: cat.name,
  })) || [];

  return (
    <Card className="p-4 mb-6" data-testid="filters-bar-container">
      <div className="space-y-4">
        {/* Search and basic filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10"
                data-testid="input-search-products"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select
              value={filters.categoryId || "all"}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-48" data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem 
                    key={category.id} 
                    value={category.id}
                    data-testid={`category-option-${category.id}`}
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="gap-2"
              data-testid="button-clear-filters"
            >
              <X className="w-3 h-3" />
              Clear
            </Button>
          </div>
        </div>

        {/* Enhanced filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Multiple Categories */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Multiple Categories
            </label>
            <MultiSelect
              options={categoryOptions}
              value={filters.categoryIds}
              onValueChange={handleMultipleCategoriesChange}
              placeholder="Select multiple categories"
              data-testid="select-multiple-categories"
            />
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Price Range
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="pl-7"
                  data-testid="input-min-price"
                />
              </div>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="pl-7"
                  data-testid="input-max-price"
                />
              </div>
            </div>
          </div>

          {/* Stock Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Package className="w-3 h-3" />
              Stock Quantity
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={stockRange.min}
                onChange={(e) => setStockRange({ ...stockRange, min: e.target.value })}
                data-testid="input-min-stock"
              />
              <Input
                type="number"
                placeholder="Max"
                value={stockRange.max}
                onChange={(e) => setStockRange({ ...stockRange, max: e.target.value })}
                data-testid="input-max-stock"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
