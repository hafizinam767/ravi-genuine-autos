'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Upload,
  X,
  Loader2,
  Sparkles,
  Search,
  AlertCircle,
  Car,
  Tag,
  Wrench,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';

interface IdentificationResult {
  partName: string;
  partCategory: string | null;
  description: string;
  possibleCarModels: string[];
  condition: string | null;
  estimatedCategory: string | null;
  tips: string;
  confidence: string;
}

const EXAMPLE_PARTS = [
  { label: 'Brake Pad', emoji: '🔧' },
  { label: 'Headlight Assembly', emoji: '💡' },
  { label: 'Engine Belt', emoji: '⚙️' },
  { label: 'Air Filter', emoji: '🌀' },
];

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  low: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function IdentifyView() {
  const { setView, setFilters } = useAppStore();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (file: File) => {
      setError(null);
      setResult(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPG, PNG, or WebP).');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImagePreview(dataUrl);
        setImageBase64(dataUrl);
      };
      reader.onerror = () => {
        setError('Failed to read the image file. Please try again.');
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const identifyPart = async () => {
    if (!imageBase64) return;

    setIsIdentifying(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ||
            'Identification failed. Please try again or contact us at 0320-0408917 / 0332-4131636.'
        );
        return;
      }

      setResult(data.identification);
    } catch {
      setError(
        'Network error. Please check your connection and try again, or contact us at 0320-0408917 / 0332-4131636.'
      );
    } finally {
      setIsIdentifying(false);
    }
  };

  const searchForPart = () => {
    if (!result) return;
    const searchTerm =
      result.partName !== 'Unknown' ? result.partName : result.estimatedCategory || '';
    if (searchTerm) {
      setFilters({ search: searchTerm });
    }
    if (result.condition && result.condition !== 'all') {
      setFilters({ condition: result.condition });
    }
    setView('catalog');
  };

  const resetAll = () => {
    removeImage();
  };

  return (
    <div className="mx-auto w-full max-w-3xl sm:py-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
          <Camera className="h-8 w-8 text-red-700" />
        </div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          AI Part Identification
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Upload a photo of any vehicle part and our AI will help identify it
        </p>
      </motion.div>

      {/* Upload Area */}
      <AnimatePresence mode="wait">
        {!imagePreview ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 sm:p-12 ${
                isDragOver
                  ? 'border-red-700 bg-red-50 dark:bg-red-950/20'
                  : 'border-border hover:border-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/10'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
                aria-label="Upload an image of a vehicle part"
              />
              <div className="flex flex-col items-center gap-4">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full transition-colors ${
                    isDragOver
                      ? 'bg-red-200 dark:bg-red-800'
                      : 'bg-muted group-hover:bg-red-100 dark:group-hover:bg-red-900/30'
                  }`}
                >
                  <Upload
                    className={`h-8 w-8 transition-colors ${
                      isDragOver
                        ? 'text-red-700'
                        : 'text-muted-foreground group-hover:text-red-700'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-base font-medium text-foreground">
                    Click to upload or drag &amp; drop
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    JPG, PNG, or WebP (max 10MB)
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Camera className="h-3.5 w-3.5" />
                  <span>Take a photo or upload from gallery</span>
                </div>
              </div>
            </div>

            {/* Example Parts */}
            <div className="mt-6">
              <p className="mb-3 text-center text-sm font-medium text-muted-foreground">
                Try these examples
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {EXAMPLE_PARTS.map((ex) => (
                  <button
                    key={ex.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <span>{ex.emoji}</span>
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-4"
          >
            {/* Image Preview */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
              <img
                src={imagePreview}
                alt="Uploaded part preview"
                className="mx-auto max-h-72 w-auto object-contain sm:max-h-80"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-3 top-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={removeImage}
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Identify Button */}
            <Button
              onClick={identifyPart}
              disabled={isIdentifying}
              className="w-full gap-2 py-6 text-base font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#B91C1C' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
              size="lg"
            >
              {isIdentifying ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Identifying Part...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Identify Part
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  Identification Failed
                </p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Indicator */}
      <AnimatePresence>
        {isIdentifying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex flex-col items-center gap-3 py-8"
          >
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-red-200 border-t-red-700" />
              <Sparkles className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-red-700" />
            </div>
            <p className="text-sm text-muted-foreground">
              Analyzing your image with AI...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Card */}
      <AnimatePresence>
        {result && !isIdentifying && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="mt-6"
          >
            <Card className="border-red-200 dark:border-red-900 overflow-hidden">
              <CardHeader className="bg-red-50 dark:bg-red-950/30 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-red-700" />
                    <CardTitle className="text-lg">Identification Result</CardTitle>
                  </div>
                  {result.confidence && (
                    <Badge
                      className={
                        CONFIDENCE_COLORS[result.confidence] ||
                        CONFIDENCE_COLORS.medium
                      }
                    >
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      {result.confidence} confidence
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Part Name */}
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                    <Wrench className="h-4 w-4 text-red-700" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Part Name</p>
                    <p className="text-base font-semibold text-foreground">
                      {result.partName}
                    </p>
                  </div>
                </div>

                {/* Category */}
                {(result.partCategory || result.estimatedCategory) && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                      <Tag className="h-4 w-4 text-red-700" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge
                          variant="secondary"
                          className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                        >
                          {result.estimatedCategory || result.partCategory}
                        </Badge>
                        {result.condition && (
                          <Badge
                            variant="outline"
                            className="border-red-300 text-red-700 dark:border-red-700 dark:text-red-400"
                          >
                            {result.condition}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {result.description && (
                  <div>
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="mt-0.5 text-sm text-foreground">
                      {result.description}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Possible Car Models */}
                {result.possibleCarModels &&
                  result.possibleCarModels.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                        <Car className="h-4 w-4 text-red-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">
                          Compatible Vehicles
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {result.possibleCarModels.map((model) => (
                            <Badge
                              key={model}
                              variant="secondary"
                              className="text-xs"
                            >
                              {model}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Tips */}
                {result.tips && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Tips
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {result.tips}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={searchForPart}
                    className="flex-1 gap-2 text-white" style={{ backgroundColor: '#B91C1C' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
                    size="lg"
                  >
                    <Search className="h-4 w-4" />
                    Search for this part
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetAll}
                    className="flex-1 gap-2 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/20"
                    size="lg"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try another image
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  Not what you&apos;re looking for? Try another angle or a clearer
                  photo.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
