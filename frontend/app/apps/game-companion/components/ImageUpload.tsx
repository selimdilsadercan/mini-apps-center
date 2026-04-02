'use client';

import { useState, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Image, Upload, X, Check } from '@phosphor-icons/react';

interface ImageUploadProps {
  value?: Id<'_storage'>;
  onChange: (fileId: Id<'_storage'> | undefined) => void;
  className?: string;
  previewSize?: 'sm' | 'md' | 'lg';
  accept?: string;
}

export default function ImageUpload({ 
  value, 
  onChange, 
  className = '', 
  previewSize = 'md',
  accept = 'image/*'
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const imageUrl = useQuery(api.files.getImageUrl, value ? { storageId: value } : "skip");

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Lütfen sadece resim dosyası seçin');
      return;
    }

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      
      const { storageId } = await result.json();
      onChange(storageId);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Dosya yüklenirken hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    onChange(undefined);
  };

  const getImageSrc = () => {
    return imageUrl || null;
  };

  return (
    <div className={`relative ${className}`}>
      {value ? (
        <div className="relative group">
          <img
            src={getImageSrc() || undefined}
            alt="Uploaded image"
            className={`${sizeClasses[previewSize]} object-cover rounded-lg border border-gray-200`}
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          className={`${sizeClasses[previewSize]} border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="text-sm text-gray-600">Yükleniyor...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload size={24} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-600 text-center">
                Resim yüklemek için<br />
                tıklayın veya sürükleyin
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
