'use client';

import React, { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { storageService, StorageBucket } from '@/lib/supabase/storage';

interface ImageUploadProps {
  bucket?: StorageBucket;
  folder?: string;
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  accept?: string;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
}

interface UploadedImage {
  url: string;
  path: string;
  loading?: boolean;
  error?: string;
}

export function ImageUpload({
  bucket = 'images',
  folder = 'listings',
  value = [],
  onChange,
  maxFiles = 10,
  maxSize = 5,
  accept = 'image/*',
  className,
  disabled = false,
  multiple = true,
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(
    value.map((url) => ({ url, path: '' }))
  );
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    if (!file.type.startsWith('image/')) {
      return 'File must be an image';
    }
    return null;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || disabled) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate files
    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else if (images.length + validFiles.length < maxFiles) {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length === 0) return;

    setUploading(true);

    // Upload files
    try {
      const uploadPromises = validFiles.map((file) =>
        storageService.upload(file, { bucket, folder })
      );

      const results = await Promise.all(uploadPromises);

      const newImages = results
        .filter((result) => !result.error)
        .map((result) => ({
          url: result.url,
          path: result.path,
        }));

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onChange?.(updatedImages.map((img) => img.url));
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [images, maxFiles]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = async (index: number) => {
    const image = images[index];

    // Delete from storage if we have the path
    if (image.path) {
      await storageService.delete(bucket, image.path);
    }

    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onChange?.(updatedImages.map((img) => img.url));
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-all',
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:border-gray-400',
          'p-6'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={disabled || images.length >= maxFiles}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          {uploading ? (
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          ) : (
            <Upload className="w-10 h-10 text-gray-400" />
          )}

          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {uploading
                ? 'Uploading...'
                : 'Drop images here or click to upload'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {multiple ? `Up to ${maxFiles} images` : 'Single image'}, max{' '}
              {maxSize}MB each
            </p>
          </div>
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
            >
              {image.url ? (
                <Image
                  src={image.url}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}

              {/* Remove button */}
              {!disabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Loading overlay */}
              {image.loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              )}

              {/* Error overlay */}
              {image.error && (
                <div className="absolute inset-0 bg-red-50 bg-opacity-90 flex items-center justify-center p-2">
                  <div className="text-center">
                    <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                    <p className="text-xs text-red-600">{image.error}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image count */}
      {images.length > 0 && (
        <p className="mt-2 text-sm text-gray-500">
          {images.length} of {maxFiles} images uploaded
        </p>
      )}
    </div>
  );
}
