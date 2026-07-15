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
import { uploadImageToCloudinary } from '@/lib/cloudinary-upload';
import { X, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface CarModel {
  id: string;
  name: string;
  make: string;
  slug: string;
  image: string | null;
}

interface CarModelFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carModel?: CarModel | null;
  onSuccess: () => void;
}

export default function CarModelForm({
  open,
  onOpenChange,
  carModel,
  onSuccess,
}: CarModelFormProps) {
  const isEdit = !!carModel;

  const [name, setName] = useState('');
  const [make, setMake] = useState('');
  const [slug, setSlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Auto-generate slug from make + name
  useEffect(() => {
    if (!isEdit || !carModel) {
      const generated = `${make} ${name}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  }, [name, make, isEdit, carModel]);

  // Populate form when editing
  useEffect(() => {
    if (carModel) {
      setName(carModel.name);
      setMake(carModel.make);
      setSlug(carModel.slug);
      setImageUrl(carModel.image || '');
    } else {
      setName('');
      setMake('');
      setSlug('');
      setImageUrl('');
    }
  }, [carModel, open]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const path = await uploadImageToCloudinary(files[0]);
      setImageUrl(path);
      toast.success('Image uploaded successfully');
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      setFileInputKey((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors['cm-name'] = 'Car model name is required';
    if (!make.trim()) newErrors['cm-make'] = 'Car make (brand) is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please complete the required fields');
      const first = Object.keys(newErrors)[0];
      const el = document.getElementById(first);
      if (el) (el as HTMLElement).focus();
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        make: make.trim(),
        image: imageUrl.trim() || null,
      };

      let res: Response;
      if (isEdit && carModel) {
        res = await fetch('/api/car-models', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: carModel.id, ...payload }),
          credentials: 'include',
        });
      } else {
        res = await fetch('/api/car-models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
      }

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || `Failed to ${isEdit ? 'update' : 'create'} car model`);
        return;
      }

      toast.success(`Car model ${isEdit ? 'updated' : 'created'} successfully`);
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
            {isEdit ? 'Edit Car Model' : 'Add New Car Model'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update car model details and image' : 'Add a new car make and model to the catalog'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Make (Brand) */}
          <div className="grid gap-2">
            <Label htmlFor="cm-make">Make (Brand) *</Label>
            <Input
              id="cm-make"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="e.g., Toyota, Honda, Suzuki"
              aria-invalid={!!errors['cm-make']}
            />
            {errors['cm-make'] && (
              <p className="text-sm text-red-600" id="error-cm-make">{errors['cm-make']}</p>
            )}
            <p className="text-xs text-muted-foreground">The car manufacturer or brand</p>
          </div>

          {/* Model Name */}
          <div className="grid gap-2">
            <Label htmlFor="cm-name">Model Name *</Label>
            <Input
              id="cm-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Corolla, Civic, Alto"
              aria-invalid={!!errors['cm-name']}
            />
            {errors['cm-name'] && (
              <p className="text-sm text-red-600" id="error-cm-name">{errors['cm-name']}</p>
            )}
          </div>

          {/* Slug (auto-generated, read-only) */}
          <div className="grid gap-2">
            <Label htmlFor="cm-slug">Slug</Label>
            <Input
              id="cm-slug"
              value={slug}
              readOnly
              className="bg-gray-50 text-muted-foreground"
              placeholder="auto-generated-from-make-and-name"
            />
            <p className="text-xs text-muted-foreground">Auto-generated from make and name</p>
          </div>

          {/* Image Upload */}
          <div className="grid gap-2">
            <Label>Car Model Image</Label>
            {imageUrl && (
              <div className="group relative mb-2 inline-block">
                <img
                  src={imageUrl}
                  alt="Car Model"
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
            {isEdit ? 'Update Car Model' : 'Create Car Model'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
