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
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  image: string | null;
}

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSuccess: () => void;
}

export default function CategoryForm({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryFormProps) {
  const isEdit = !!category;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEdit || !category) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  }, [name, isEdit, category]);

  // Populate form when editing
  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description || '');
      setIcon(category.icon || '');
      setImageUrl(category.image || '');
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setIcon('');
      setImageUrl('');
    }
  }, [category, open]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', files[0]);

      const res = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });

      if (!res.ok) {
        let errorMsg = 'Upload failed';
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
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
      if (paths.length > 0) {
        setImageUrl(paths[0]);
        toast.success('Image uploaded successfully');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      setFileInputKey((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        icon: icon.trim() || null,
        description: description.trim() || null,
        image: imageUrl.trim() || null,
      };

      let res: Response;
      if (isEdit && category) {
        res = await fetch('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: category.id, ...payload }),
          credentials: 'include',
        });
      } else {
        res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
      }

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || `Failed to ${isEdit ? 'update' : 'create'} category`);
        return;
      }

      toast.success(`Category ${isEdit ? 'updated' : 'created'} successfully`);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl" style={{ color: '#1a1a2e' }}>
            {isEdit ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update category details and image' : 'Create a new product category'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="cat-name">Category Name *</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Engine Parts"
            />
          </div>

          {/* Slug (auto-generated, read-only) */}
          <div className="grid gap-2">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={slug}
              readOnly
              className="bg-gray-50 text-muted-foreground"
              placeholder="auto-generated-from-name"
            />
            <p className="text-xs text-muted-foreground">Auto-generated from name</p>
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Category description..."
              rows={3}
            />
          </div>

          {/* Icon */}
          <div className="grid gap-2">
            <Label htmlFor="cat-icon">Icon Name</Label>
            <Input
              id="cat-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="e.g., Cog, Car, Shield"
            />
            <p className="text-xs text-muted-foreground">Lucide icon name for display</p>
          </div>

          {/* Image Upload */}
          <div className="grid gap-2">
            <Label>Category Image</Label>
            {imageUrl && (
              <div className="group relative mb-2 inline-block">
                <img
                  src={imageUrl}
                  alt="Category"
                  className="h-24 w-24 rounded-md border object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-4">
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
                    <span className="text-sm text-gray-500">Click to upload image</span>
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
            {isEdit ? 'Update Category' : 'Create Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
