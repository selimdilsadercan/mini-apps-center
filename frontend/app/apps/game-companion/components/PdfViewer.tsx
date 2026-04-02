'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { File, Download } from '@phosphor-icons/react';

interface PdfViewerProps {
  pdfId: Id<'_storage'>;
  fileName?: string;
}

export default function PdfViewer({ pdfId, fileName = 'Kurallar.pdf' }: PdfViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getFileUrl = useQuery(api.files.getFileUrl, { id: pdfId });

  useEffect(() => {
    if (getFileUrl) {
      setPdfUrl(getFileUrl);
      setIsLoading(false);
    }
  }, [getFileUrl]);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleError = () => {
    setError('PDF yüklenirken bir hata oluştu.');
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">PDF yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div className="text-center py-12">
        <File size={48} className="text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">
          {error || 'PDF dosyası bulunamadı.'}
        </p>
        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
        >
          <Download size={16} />
          <span>PDF'i İndir</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* PDF Controls */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <File size={24} className="text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-800">{fileName}</h3>
            <p className="text-sm text-gray-500">Oyun kuralları PDF dosyası</p>
          </div>
        </div>
        
        <button
          onClick={handleDownload}
          className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download size={16} />
          <span>İndir</span>
        </button>
      </div>

      {/* PDF Viewer */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-[600px] w-full">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title="Game Rules PDF"
            onError={handleError}
          />
        </div>
      </div>
    </div>
  );
}
