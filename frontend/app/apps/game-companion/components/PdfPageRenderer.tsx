'use client';

import { useState, useEffect, useRef } from 'react';
import { File, CaretLeft, CaretRight } from '@phosphor-icons/react';

interface PdfPageRendererProps {
  pdfId: string;
  fileName?: string;
}

// Local mock hook
const useQuery = (apiPath: string, args?: any): any => {
  if (apiPath.includes("getFileUrl")) return null; // We don't have storage in mock mode
  return undefined;
};

interface PdfPage {
  pageNumber: number;
  imageDataUrl: string;
}

export default function PdfPageRenderer({ pdfId, fileName = 'Kurallar.pdf' }: PdfPageRendererProps) {
  const [pdfPages, setPdfPages] = useState<PdfPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getFileUrl = useQuery("api.files.getFileUrl", { id: pdfId });

  // Load PDF.js only on client side
  useEffect(() => {
    const loadPdfjs = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        
        // Set up worker via CDN for better reliability in Next.js + Capacitor
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        
        setPdfjsLib(pdfjs);
      } catch (err) {
        console.error('Error loading PDF.js:', err);
        setError('PDF kütüphanesi yüklenirken hata oluştu.');
        setIsLoading(false);
      }
    };

    loadPdfjs();
  }, []);

  useEffect(() => {
    if (getFileUrl && pdfjsLib) {
      loadPdfPages(getFileUrl);
    }
  }, [getFileUrl, pdfjsLib]);

  const loadPdfPages = async (pdfUrl: string) => {
    if (!pdfjsLib) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Load the PDF document
      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      const pages: PdfPage[] = [];

      // Render each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        
        // Set up canvas for rendering
        const canvas = canvasRef.current || document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) continue;

        // Calculate scale to fit width (max 800px)
        const viewport = page.getViewport({ scale: 1 });
        const maxWidth = 800;
        const scale = maxWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // Render page to canvas
        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
          canvas: canvas,
        }).promise;

        // Convert canvas to data URL
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        pages.push({
          pageNumber: pageNum,
          imageDataUrl,
        });
      }

      setPdfPages(pages);
    } catch (err) {
      console.error('Error loading PDF pages:', err);
      setError('PDF yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < pdfPages.length) {
      setCurrentPage(pageIndex);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">PDF sayfaları yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || pdfPages.length === 0) {
    return (
      <div className="text-center py-12">
        <File size={48} className="text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">
          {error || 'PDF dosyası bulunamadı.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* PDF Header */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <File size={24} className="text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-800">{fileName}</h3>
            <p className="text-sm text-gray-500">
              {pdfPages.length} sayfa • Sayfa {currentPage + 1} / {pdfPages.length}
            </p>
          </div>
        </div>
        
        {/* Page Navigation */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CaretLeft size={16} />
          </button>
          <span className="text-sm text-gray-600 px-2">
            {currentPage + 1} / {pdfPages.length}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === pdfPages.length - 1}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CaretRight size={16} />
          </button>
        </div>
      </div>

      {/* PDF Page Display */}
      <div className="space-y-4">
        {/* Current Page */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-center">
            <img
              src={pdfPages[currentPage].imageDataUrl}
              alt={`Sayfa ${currentPage + 1}`}
              className="max-w-full h-auto mx-auto rounded-lg shadow-sm"
              style={{ maxHeight: '80vh' }}
            />
          </div>
        </div>

        {/* Page Thumbnails */}
        {pdfPages.length > 1 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Sayfalar</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {pdfPages.map((page, index) => (
                <button
                  key={page.pageNumber}
                  onClick={() => goToPage(index)}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    index === currentPage
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <img
                    src={page.imageDataUrl}
                    alt={`Sayfa ${page.pageNumber}`}
                    className="w-full h-auto rounded"
                    style={{ maxHeight: '120px' }}
                  />
                  <p className="text-xs text-gray-600 mt-1 text-center">
                    {page.pageNumber}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}