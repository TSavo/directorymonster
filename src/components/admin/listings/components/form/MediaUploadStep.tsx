"use client";

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { ListingFormData, ListingMedia, MediaType } from '../../types';

interface MediaUploadStepProps {
  formData: ListingFormData;
  errors: Record<string, any>;
  updateField: <K extends keyof ListingFormData>(field: K, value: ListingFormData[K]) => void;
  isSubmitting: boolean;
}

export function MediaUploadStep({
  formData,
  errors,
  updateField,
  isSubmitting
}: MediaUploadStepProps) {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    
    try {
      // Mock file upload progress
      const mockUploadInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null) return 0;
          return Math.min(prev + 10, 90);
        });
      }, 300);
      
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      clearInterval(mockUploadInterval);
      setUploadProgress(100);
      
      // Create new media objects
      const newMedia: ListingMedia[] = Array.from(files).map((file, index) => ({
        id: `temp-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        type: MediaType.IMAGE,
        alt: file.name,
        isPrimary: formData.media.length === 0 && index === 0,
        sortOrder: formData.media.length + index,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      // Update form data
      updateField('media', [...formData.media, ...newMedia]);
      
      // Reset upload state
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(null);
      }, 500);
    } catch (err) {
      console.error('Error uploading files:', err);
      setUploadError('Failed to upload files. Please try again.');
      setUploading(false);
      setUploadProgress(null);
    }
    
    // Clear input
    e.target.value = '';
  }, [formData.media, updateField]);

  // Remove media item
  const handleRemoveMedia = (mediaId: string) => {
    const newMedia = formData.media.filter((item) => item.id !== mediaId);
    
    // If removing primary image, set the first one as primary
    if (newMedia.length > 0 && formData.media.find((item) => item.id === mediaId)?.isPrimary) {
      newMedia[0].isPrimary = true;
    }
    
    updateField('media', newMedia);
  };

  // Set media item as primary
  const handleSetPrimary = (mediaId: string) => {
    const newMedia = formData.media.map((item) => ({
      ...item,
      isPrimary: item.id === mediaId
    }));
    
    updateField('media', newMedia);
  };

  return (
    <div className="space-y-4" data-testid="listing-form-media-upload">
      <h3 className="text-lg font-medium text-gray-900">Upload Media</h3>
      
      {errors.media && (
        <p className="mt-1 text-sm text-red-600">{errors.media}</p>
      )}
      
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            />
          </svg>
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
            >
              <span>Upload a file</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                disabled={isSubmitting || uploading}
                data-testid="media-upload-input"
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
        </div>
      </div>
      
      {uploadProgress !== null && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
      
      {uploadError && (
        <p className="mt-1 text-sm text-red-600">{uploadError}</p>
      )}
      
      {formData.media.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {formData.media.map((item) => (
            <div 
              key={item.id}
              className={`relative rounded-lg overflow-hidden border ${
                item.isPrimary ? 'border-blue-500' : 'border-gray-300'
              }`}
            >
              <div className="relative h-32 w-full">
                <Image
                  src={item.url}
                  alt={item.alt || 'Media preview'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              
              <div className="absolute top-1 right-1 flex space-x-1">
                <button
                  type="button"
                  onClick={() => handleSetPrimary(item.id)}
                  disabled={item.isPrimary || isSubmitting}
                  className={`p-1 rounded-full ${
                    item.isPrimary
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Set as primary"
                  data-testid={`set-primary-${item.id}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(item.id)}
                  disabled={isSubmitting}
                  className="p-1 bg-white text-red-600 rounded-full hover:bg-gray-100"
                  title="Remove"
                  data-testid={`remove-media-${item.id}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MediaUploadStep;
