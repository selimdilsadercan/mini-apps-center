'use client';

import { useState, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { File, X, Upload, CheckCircle } from '@phosphor-icons/react';

interface PdfUploadProps {
  gameId: Id<'games'>;
  currentPdfId?: Id<'_storage'>;
  onUploadComplete?: (pdfId: Id<'_storage'>) => void;
  onDelete?: () => void;
}

export default function PdfUpload({ gameId, currentPdfId, onUploadComplete, onDelete }: PdfUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const updateGame = useMutation(api.games.updateGame);
  const deleteGamePdf = useMutation(api.games.deleteGamePdf);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadError('Lütfen sadece PDF dosyası yükleyin.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Dosya boyutu 10MB\'dan küçük olmalıdır.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      const { storageId } = await result.json();

      // Update game with PDF
      await updateGame({
        id: gameId,
        rulesPdf: storageId,
      });

      setUploadSuccess(true);
      onUploadComplete?.(storageId);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('PDF upload error:', error);
      setUploadError('PDF yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGamePdf({ id: gameId });
      onDelete?.();
      setUploadSuccess(false);
    } catch (error) {
      console.error('PDF delete error:', error);
      setUploadError('PDF silinirken bir hata oluştu.');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Kural PDF'i</h3>
        {currentPdfId && (
          <button
            onClick={handleDelete}
            className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm"
          >
            <X size={16} />
            <span>PDF'i Sil</span>
          </button>
        )}
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {currentPdfId ? (
          <div className="space-y-3">
            <CheckCircle size={48} className="text-green-500 mx-auto" />
            <div>
              <p className="text-green-600 font-medium">PDF başarıyla yüklendi!</p>
              <p className="text-gray-500 text-sm">Kurallar artık PDF olarak görüntülenecek.</p>
            </div>
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isUploading ? 'Yükleniyor...' : 'Yeni PDF Yükle'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <File size={48} className="text-gray-400 mx-auto" />
            <div>
              <p className="text-gray-600 font-medium">PDF Kural Dosyası Yükle</p>
              <p className="text-gray-500 text-sm">
                Oyun kurallarını PDF formatında yükleyebilirsiniz. 
                Maksimum dosya boyutu: 10MB
              </p>
            </div>
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
            >
              <Upload size={16} />
              <span>{isUploading ? 'Yükleniyor...' : 'PDF Seç'}</span>
            </button>
          </div>
        )}

        {uploadError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{uploadError}</p>
          </div>
        )}

        {uploadSuccess && !currentPdfId && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">PDF başarıyla yüklendi!</p>
          </div>
        )}
      </div>
    </div>
  );
}
