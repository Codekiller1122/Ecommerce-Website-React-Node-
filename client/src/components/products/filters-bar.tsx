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
import { Search, X } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";

interface FiltersBarProps {
  filters: {
    search: string;
    categoryId: string;
    page: number;
    sortBy: string;
    sortOrder: string;
  };
  onFiltersChange: (filters: any) => void;
}

export default function FiltersBar({ filters, onFiltersChange }: FiltersBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search);
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

  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({ 
      ...filters, 
      categoryId: categoryId === "all" ? "" : categoryId, 
      page: 1 
    });
  };

  const handleClearFilters = () => {
    setSearchValue("");
    onFiltersChange({
      ...filters,
      search: "",
      categoryId: "",
      page: 1,
    });
  };

  return (
    <Card className="p-4 mb-6" data-testid="filters-bar-container">
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
    </Card>
  );
}
