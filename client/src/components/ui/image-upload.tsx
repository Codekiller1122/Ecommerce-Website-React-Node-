import { useState, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Upload, Link, X, Image } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

interface ImageUploadProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, placeholder, disabled }: ImageUploadProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [urlValue, setUrlValue] = useState(value || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload/product-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      onChange(data.imageUrl);
      setIsUploading(false);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      setIsUploading(false);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      uploadMutation.mutate(file);
    }
  };

  const handleUrlSubmit = () => {
    onChange(urlValue);
  };

  const handleClearImage = () => {
    onChange("");
    setUrlValue("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Product Image</Label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearImage}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-clear-image"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Image Preview */}
      {value && (
        <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden border">
          <img
            src={value}
            alt="Product preview"
            className="w-full h-full object-cover"
            data-testid="img-product-preview"
          />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as "upload" | "url")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" data-testid="tab-upload">
            <Upload className="w-4 h-4 mr-1" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" data-testid="tab-url">
            <Link className="w-4 h-4 mr-1" />
            URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-2">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled || isUploading}
              data-testid="input-file-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading || uploadMutation.isPending}
              className="w-full"
              data-testid="button-select-file"
            >
              <Image className="w-4 h-4 mr-2" />
              {isUploading || uploadMutation.isPending ? 'Uploading...' : 'Select Image'}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>
        </TabsContent>

        <TabsContent value="url" className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder={placeholder || "https://example.com/image.jpg"}
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              disabled={disabled}
              data-testid="input-image-url"
            />
            <Button
              type="button"
              onClick={handleUrlSubmit}
              disabled={disabled || !urlValue.trim()}
              data-testid="button-use-url"
            >
              Use URL
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}