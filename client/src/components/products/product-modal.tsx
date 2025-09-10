import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, type ProductWithCategories } from "@shared/schema";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useToast } from "@/hooks/use-toast";
import { MultiSelect } from "@/components/ui/multi-select";
import { ImageUpload } from "@/components/ui/image-upload";
import { z } from "zod";

const formSchema = insertProductSchema.extend({
  categoryIds: z.array(z.string()).min(1, "At least one category is required"),
});

type FormData = z.infer<typeof formSchema>;

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  product?: ProductWithCategories | null;
}

export default function ProductModal({ open, onClose, product }: ProductModalProps) {
  const { toast } = useToast();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const { data: categories } = useCategories();

  const isEditing = !!product;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "0",
      stockQuantity: 0,
      imageUrl: "",
      categoryIds: [],
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description || "",
        price: product.price,
        stockQuantity: product.stockQuantity,
        imageUrl: product.imageUrl || "",
        categoryIds: product.categories.map(c => c.id),
      });
    } else {
      form.reset({
        name: "",
        description: "",
        price: "0",
        stockQuantity: 0,
        imageUrl: "",
        categoryIds: [],
      });
    }
  }, [product, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const { categoryIds, ...productData } = data;
      
      if (isEditing && product) {
        await updateProductMutation.mutateAsync({
          id: product.id,
          product: productData,
          categoryIds,
        });
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        await createProductMutation.mutateAsync({
          product: productData,
          categoryIds,
        });
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} product`,
        variant: "destructive",
      });
    }
  };

  const categoryOptions = categories?.map(cat => ({
    value: cat.id,
    label: cat.name,
  })) || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="product-modal-content">
        <DialogHeader>
          <DialogTitle data-testid="modal-title">
            {isEditing ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="product-form">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter product name"
              data-testid="input-product-name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive" data-testid="error-product-name">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Enter product description"
              rows={3}
              className="resize-none"
              data-testid="textarea-product-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("price")}
                  placeholder="0.00"
                  className="pl-8"
                  data-testid="input-product-price"
                />
              </div>
              {form.formState.errors.price && (
                <p className="text-sm text-destructive" data-testid="error-product-price">
                  {form.formState.errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Stock Quantity *</Label>
              <Input
                id="stockQuantity"
                type="number"
                min="0"
                {...form.register("stockQuantity", { valueAsNumber: true })}
                placeholder="0"
                data-testid="input-product-stock"
              />
              {form.formState.errors.stockQuantity && (
                <p className="text-sm text-destructive" data-testid="error-product-stock">
                  {form.formState.errors.stockQuantity.message}
                </p>
              )}
            </div>
          </div>

          <ImageUpload
            value={form.watch("imageUrl")}
            onChange={(imageUrl) => form.setValue("imageUrl", imageUrl)}
            placeholder="https://example.com/image.jpg"
            disabled={createProductMutation.isPending || updateProductMutation.isPending}
          />

          <div className="space-y-2">
            <Label>Categories *</Label>
            <MultiSelect
              options={categoryOptions}
              value={form.watch("categoryIds")}
              onValueChange={(value) => form.setValue("categoryIds", value)}
              placeholder="Select categories"
              data-testid="select-product-categories"
            />
            {form.formState.errors.categoryIds && (
              <p className="text-sm text-destructive" data-testid="error-product-categories">
                {form.formState.errors.categoryIds.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
              data-testid="button-cancel-product"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createProductMutation.isPending || updateProductMutation.isPending}
              data-testid="button-submit-product"
            >
              {isEditing ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
