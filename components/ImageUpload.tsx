'use client';

import { useState, useRef, useCallback } from 'react';

interface ImageUploadProps {
  onUpload: (urls: string[]) => void;
  existingImages?: string[];
  maxFiles?: number;
}

interface UploadingFile {
  file: File;
  preview: string;
  uploading: boolean;
  error?: string;
}

export function ImageUpload({ onUpload, existingImages = [], maxFiles = 10 }: ImageUploadProps) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(existingImages);
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const handleFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));
    const remainingSlots = maxFiles - files.length - uploadedUrls.length;
    const filesToAdd = imageFiles.slice(0, remainingSlots);

    const uploadingFiles = filesToAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
    }));

    setFiles(prev => [...prev, ...uploadingFiles]);
  };

  const uploadFiles = async () => {
    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, uploading: true } : f
      ));

      try {
        const formData = new FormData();
        formData.append('file', fileData.file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        urls.push(data.url);

        setFiles(prev => prev.filter((_, idx) => idx !== i));
        i--;
      } catch (error) {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, uploading: false, error: 'Upload failed' } : f
        ));
      }
    }

    if (urls.length > 0) {
      const newUrls = [...uploadedUrls, ...urls];
      setUploadedUrls(newUrls);
      onUpload(newUrls);
    }
  };

  const removeFile = (index: number) => {
    const file = files[index];
    URL.revokeObjectURL(file.preview);
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedImage = (index: number) => {
    const newUrls = uploadedUrls.filter((_, i) => i !== index);
    setUploadedUrls(newUrls);
    onUpload(newUrls);
  };

  const totalImages = files.length + uploadedUrls.length;
  const canUploadMore = totalImages < maxFiles;

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      {canUploadMore && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="text-gray-600">
            {isDragActive ? (
              <p>Drop the images here...</p>
            ) : (
              <>
                <p className="mb-2">Drag & drop images here, or click to select</p>
                <p className="text-sm text-gray-400">
                  Supports: PNG, JPG, JPEG, GIF, WEBP
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Preview Grid */}
      {(files.length > 0 || uploadedUrls.length > 0) && (
        <div className="grid grid-cols-3 gap-3">
          {/* Uploaded Images */}
          {uploadedUrls.map((url, index) => (
            <div key={`uploaded-${index}`} className="relative group">
              <img
                src={url}
                alt={`Uploaded ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeUploadedImage(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full 
                         opacity-0 group-hover:opacity-100 transition-opacity
                         flex items-center justify-center text-sm"
              >
                ×
              </button>
              <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                ✓
              </div>
            </div>
          ))}

          {/* Pending Uploads */}
          {files.map((fileData, index) => (
            <div key={`pending-${index}`} className="relative group">
              <img
                src={fileData.preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg opacity-70"
              />
              {fileData.uploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {fileData.error && (
                <div className="absolute bottom-1 left-1 right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded text-center">
                  Error
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={fileData.uploading}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full 
                         opacity-0 group-hover:opacity-100 transition-opacity
                         flex items-center justify-center text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <button
          type="button"
          onClick={uploadFiles}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Upload {files.length} image{files.length !== 1 ? 's' : ''}
        </button>
      )}

      {/* Image Count */}
      <p className="text-sm text-gray-500 text-center">
        {totalImages} / {maxFiles} images
      </p>
    </div>
  );
}