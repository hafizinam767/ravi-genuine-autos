'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
}

interface CarModel {
  id: string;
  name: string;
  make: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  condition: string;
  stock: number;
  images: string;
  sku: string | null;
  partNumber: string | null;
  categoryId: string;
  carModelId: string;
  featured: boolean;
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess: () => void;
}

export default function ProductForm({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductFormProps) {
  const isEdit = !!product;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('new');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [carModelId, setCarModelId] = useState('');
  const [sku, setSku] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [featured, setFeatured] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [categories, setCategories] = useState<Category[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track a key to force re-mount of the file input so same file can be re-selected
  const [fileInputKey, setFileInputKey] = useState(0);

  // Load categories and car models
  useEffect(() => {
    async function loadOptions() {
      try {
        const [catRes, cmRes] = await Promise.all([
          fetch('/api/categories', { cache: 'no-store' }),
          fetch('/api/car-models', { cache: 'no-store' }),
        ]);
        if (!catRes.ok || !cmRes.ok) throw new Error('Failed to load options');
        const catData = await catRes.json();
        const cmData = await cmRes.json();
        setCategories(catData.categories || []);
        setCarModels(cmData.carModels || []);
      } catch {
        toast.error('Failed to load categories and car models');
      }
    }
    if (open) loadOptions();
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description);
      setPrice(String(product.price));
      setCondition(product.condition);
      setStock(String(product.stock));
      setCategoryId(product.categoryId);
      setCarModelId(product.carModelId);
      setSku(product.sku || '');
      setPartNumber(product.partNumber || '');
      setFeatured(product.featured);
      setImageUrls(product.images ? product.images.split(',').filter(Boolean) : []);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setCondition('new');
      setStock('');
      setCategoryId('');
      setCarModelId('');
      setSku('');
      setPartNumber('');
      setFeatured(false);
      setImageUrls([]);
    }
  }, [product, open]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });

      if (!res.ok) {
        let errorMsg = 'Upload failed';
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
          // If we can't parse JSON, check status
          if (res.status === 404) {
            errorMsg = 'Upload service not available. Please contact support.';
          } else if (res.status === 401) {
            errorMsg = 'Please log in again to upload images.';
          }
        }
        toast.error(errorMsg);
        return;
      }

      const data = await res.json();
      const paths: string[] = data.paths || [];

      if (paths.length === 0) {
        toast.error('No images were uploaded');
        return;
      }

      setImageUrls((prev) => [...prev, ...paths]);
      toast.success(`${paths.length} image(s) uploaded successfully`);
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      // Reset the file input so the same file can be re-selected
      setFileInputKey((prev) => prev + 1);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Client-side validation
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors['product-name'] = 'Product name is required';
    if (!description.trim()) newErrors['product-desc'] = 'Description is required';
    if (price === '' || Number.isNaN(parseFloat(price)) || parseFloat(price) < 0) newErrors['product-price'] = 'Valid price is required';
    if (!categoryId) newErrors['product-category'] = 'Category is required';
    if (!carModelId) newErrors['product-car-model'] = 'Car model is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please complete the required fields');
      // focus first invalid field
      const first = Object.keys(newErrors)[0];
      const el = document.getElementById(first);
      if (el) (el as HTMLElement).focus();
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        condition,
        stock: stock ? parseInt(stock, 10) : 0,
        categoryId,
        carModelId,
        sku: sku.trim() || null,
        partNumber: partNumber.trim() || null,
        featured,
        images: imageUrls.join(','),
      };

      let res: Response;
      if (isEdit) {
        res = await fetch(`/api/products/${product!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
      }

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || `Failed to ${isEdit ? 'update' : 'create'} product`);
        return;
      }

      toast.success(`Product ${isEdit ? 'updated' : 'created'} successfully`);
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl" style={{ color: '#1a1a2e' }}>
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update product details and images' : 'Fill in the details to add a new product'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="product-name">Product Name *</Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Brake Pad Set Front"
              aria-invalid={!!errors['product-name']}
            />
            {errors['product-name'] && (
              <p className="text-sm text-red-600" id="error-product-name">{errors['product-name']}</p>
            )}
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="product-desc">Description *</Label>
            <Textarea
              id="product-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed product description..."
              rows={3}
              aria-invalid={!!errors['product-desc']}
            />
            {errors['product-desc'] && (
              <p className="text-sm text-red-600" id="error-product-desc">{errors['product-desc']}</p>
            )}
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="product-price">Price (PKR) *</Label>
              <Input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                aria-invalid={!!errors['product-price']}
              />
              {errors['product-price'] && (
                <p className="text-sm text-red-600" id="error-product-price">{errors['product-price']}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-stock">Stock</Label>
              <Input
                id="product-stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Condition & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="product-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors['product-category'] && (
                <p className="text-sm text-red-600" id="error-product-category">{errors['product-category']}</p>
              )}
            </div>
          </div>

          {/* Car Model */}
          <div className="grid gap-2">
            <Label>Car Model *</Label>
            <Select value={carModelId} onValueChange={setCarModelId}>
              <SelectTrigger id="product-car-model">
                <SelectValue placeholder="Select car model" />
              </SelectTrigger>
              <SelectContent>
                {carModels.map((cm) => (
                  <SelectItem key={cm.id} value={cm.id}>
                    {cm.make} {cm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors['product-car-model'] && (
              <p className="text-sm text-red-600" id="error-product-car-model">{errors['product-car-model']}</p>
            )}
          </div>

          {/* SKU & Part Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="product-sku">SKU</Label>
              <Input
                id="product-sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU-001"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-partnumber">Part Number</Label>
              <Input
                id="product-partnumber"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="PN-12345"
              />
            </div>
          </div>

          {/* Featured toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">Featured Product</Label>
              <p className="text-xs text-muted-foreground">
                Featured products appear on the homepage
              </p>
            </div>
            <Switch checked={featured} onCheckedChange={setFeatured} />
          </div>

          {/* Image Upload */}
          <div className="grid gap-2">
            <Label>Product Images</Label>
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-4">
              {imageUrls.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="group relative">
                      <img
                        src={url}
                        alt={`Product ${index + 1}`}
                        className="h-20 w-20 rounded-md border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="flex w-full cursor-pointer flex-col items-center gap-1 rounded-md p-2 transition-colors hover:bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-8 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-500">Uploading...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="size-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Click to upload images</span>
                    <span className="text-xs text-gray-400">PNG, JPG, GIF, WebP up to 5MB</span>
                  </>
                )}
              </button>
              {/* Hidden file input — uses ref for reliable triggering inside Dialog */}
              <input
                key={fileInputKey}
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="text-white"
            style={{ backgroundColor: '#B91C1C' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#991B1B')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = '#B91C1C')
            }
          >
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
