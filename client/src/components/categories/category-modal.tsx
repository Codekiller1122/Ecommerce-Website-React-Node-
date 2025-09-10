import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategorySchema, type Category } from "@shared/schema";
import { useCreateCategory, useUpdateCategory } from "@/hooks/use-categories";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type FormData = z.infer<typeof insertCategorySchema>;

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
}

export default function CategoryModal({ open, onClose, category }: CategoryModalProps) {
  const { toast } = useToast();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  const isEditing = !!category;

  const form = useForm<FormData>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
      });
    } else {
      form.reset({
        name: "",
      });
    }
  }, [category, form]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && category) {
        await updateCategoryMutation.mutateAsync({
          id: category.id,
          category: data,
        });
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        await createCategoryMutation.mutateAsync(data);
        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} category`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="category-modal-content">
        <DialogHeader>
          <DialogTitle data-testid="category-modal-title">
            {isEditing ? "Edit Category" : "Add New Category"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="category-form">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter category name"
              data-testid="input-category-name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive" data-testid="error-category-name">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
              data-testid="button-cancel-category"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              data-testid="button-submit-category"
            >
              {isEditing ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
