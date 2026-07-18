"use client";
import { getAppRootUrl } from "@/lib/apps";

import { useState, useEffect, useRef } from "react";
import { 
  FilePdf, 
  Upload, 
  Trash, 
  Download, 
  ArrowsOutCardinal, 
  CaretLeft,
  CaretRight,
  Plus,
  Info,
  X,
  SquaresFour,
  Image as ImageIcon,
  FileArrowDown
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { PDFDocument, PageSizes, rgb } from "pdf-lib";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Types
type ToolMode = "rearrange" | "image-pdf" | "6-to-1" | "compress" | null;

interface PdfPage {
  id: string; // unique id for dnd
  originalIndex: number;
  imageDataUrl: string;
  fileId: string; // points to the source file id
}

interface PdfFileItem {
  id: string;
  name: string;
  arrayBuffer: ArrayBuffer;
}

// Sortable Item Component
function SortablePage({ 
  page, 
  onDelete, 
  index,
  fileName
}: { 
  page: PdfPage; 
  onDelete: (id: string) => void;
  index: number;
  fileName: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group flex flex-col items-center"
    >
      <div 
        {...attributes} 
        {...listeners}
        className="relative w-full aspect-[3/4] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-grab active:cursor-grabbing hover:border-[#E03131]/40 transition-colors"
      >
        <img
          src={page.imageDataUrl}
          alt={`Page ${index + 1}`}
          className="w-full h-full object-contain p-2"
        />
        <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
          {index + 1}
        </div>
        
        {/* Source file tag if multiple files exist */}
        <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white text-[8px] font-medium px-1.5 py-0.5 rounded truncate backdrop-blur-sm pointer-events-none text-center opacity-0 group-hover:opacity-100 transition-opacity">
          {fileName}
        </div>
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-colors pointer-events-none">
          <ArrowsOutCardinal size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      
      <button
        onClick={() => onDelete(page.id)}
        className="mt-2 p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
      >
        <Trash size={16} weight="bold" />
      </button>
    </div>
  );
}

export default function PdfToolsPage() {
  const [pdfFiles, setPdfFiles] = useState<PdfFileItem[]>([]);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [mode, setMode] = useState<ToolMode>(null);
  const [compressLevel, setCompressLevel] = useState<"low" | "medium" | "high">("medium");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const appendFileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load PDF.js
  useEffect(() => {
    const loadPdfjs = async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        // @ts-ignore
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        setPdfjsLib(pdfjs);
      } catch (err) {
        console.error("Error loading PDF.js:", err);
        toast.error("PDF kütüphanesi yüklenemedi.");
      }
    };
    loadPdfjs();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      processPdf(file, false);
    } else if (file) {
      toast.error("Lütfen geçerli bir PDF dosyası seçin.");
    }
  };

  const handleAppendFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      processPdf(file, true);
    } else if (file) {
      toast.error("Lütfen geçerli bir PDF dosyası seçin.");
    }
    if (appendFileInputRef.current) {
      appendFileInputRef.current.value = "";
    }
  };

  const processPdf = async (file: File, append = false) => {
    if (!pdfjsLib) return;
    
    setIsLoading(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Slice arrayBuffer to prevent detachment
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      const fileId = `file-${Math.random().toString(36).substr(2, 9)}`;
      
      const newFileItem: PdfFileItem = {
        id: fileId,
        name: file.name,
        arrayBuffer,
      };

      const loadedPages: PdfPage[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;
          
          loadedPages.push({
            id: `page-${i}-${Math.random().toString(36).substr(2, 9)}`,
            originalIndex: i - 1,
            imageDataUrl: canvas.toDataURL("image/jpeg", 0.7),
            fileId: fileId,
          });
        }
      }
      
      if (append) {
        setPdfFiles((prev) => [...prev, newFileItem]);
        setPages((prev) => [...prev, ...loadedPages]);
        toast.success(`${pdf.numPages} sayfa daha eklendi.`);
      } else {
        setPdfFiles([newFileItem]);
        setPages(loadedPages);
        toast.success(`${pdf.numPages} sayfa yüklendi.`);
      }
    } catch (err) {
      console.error("Error processing PDF:", err);
      toast.error("PDF işlenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    
    setActiveId(null);
  };

  const handleDeletePage = (id: string) => {
    setPages(pages.filter((p) => p.id !== id));
    toast.success("Sayfa kaldırıldı.");
  };

  const getModifiedPdf = async () => {
    if (pdfFiles.length === 0 || pages.length === 0) return null;
    
    const newPdf = await PDFDocument.create();
    
    // Cache loaded PDFDocument instances by fileId
    const loadedDocs: Record<string, PDFDocument> = {};
    const getDoc = async (fileId: string) => {
      if (loadedDocs[fileId]) return loadedDocs[fileId];
      const fileItem = pdfFiles.find(f => f.id === fileId);
      if (!fileItem) throw new Error("File not found");
      // Slice arrayBuffer to prevent detachment
      const doc = await PDFDocument.load(fileItem.arrayBuffer.slice(0));
      loadedDocs[fileId] = doc;
      return doc;
    };
    
    if (mode === "rearrange" || mode === null) {
      for (const pageInfo of pages) {
        const srcDoc = await getDoc(pageInfo.fileId);
        const copiedPages = await newPdf.copyPages(srcDoc, [pageInfo.originalIndex]);
        newPdf.addPage(copiedPages[0]);
      }
    } else if (mode === "compress") {
      if (!pdfjsLib) throw new Error("PDFJS not loaded");
      
      const config = {
        low: { scale: 1.5, quality: 0.85 },
        medium: { scale: 1.0, quality: 0.70 },
        high: { scale: 0.75, quality: 0.50 }
      }[compressLevel];

      const loadedPdfjsDocs: Record<string, any> = {};
      const getPdfjsDoc = async (fileId: string) => {
        if (loadedPdfjsDocs[fileId]) return loadedPdfjsDocs[fileId];
        const fileItem = pdfFiles.find(f => f.id === fileId);
        if (!fileItem) throw new Error("File not found");
        // Slice arrayBuffer to prevent detachment
        const doc = await pdfjsLib.getDocument({ data: fileItem.arrayBuffer.slice(0) }).promise;
        loadedPdfjsDocs[fileId] = doc;
        return doc;
      };

      for (let i = 0; i < pages.length; i++) {
        const pageInfo = pages[i];
        const pdfjsDoc = await getPdfjsDoc(pageInfo.fileId);
        const page = await pdfjsDoc.getPage(pageInfo.originalIndex + 1);
        const viewport = page.getViewport({ scale: config.scale });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          const imageDataUrl = canvas.toDataURL("image/jpeg", config.quality);
          const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer());
          const image = await newPdf.embedJpg(imageBytes);
          const newPage = newPdf.addPage([viewport.width, viewport.height]);
          newPage.drawImage(image, { x: 0, y: 0, width: viewport.width, height: viewport.height });
        }
      }
    } else if (mode === "6-to-1") {
      const A4 = PageSizes.A4;
      const margin = (15 * 72) / 25.4;
      const gap = (5 * 72) / 25.4;
      const availableWidth = A4[0] - 2 * margin;
      const availableHeight = A4[1] - 2 * margin;
      const slotWidth = (availableWidth - gap) / 2;
      const slotHeight = (availableHeight - 2 * gap) / 3;

      for (let i = 0; i < pages.length; i += 6) {
        const newPage = newPdf.addPage(A4);
        for (let j = 0; j < 6 && (i + j) < pages.length; j++) {
          const pageInfo = pages[i + j];
          const srcDoc = await getDoc(pageInfo.fileId);
          const copiedPages = await newPdf.copyPages(srcDoc, [pageInfo.originalIndex]);
          const sourcePage = copiedPages[0];
          const { width, height } = sourcePage.getSize();
          
          const col = j % 2;
          const row = Math.floor(j / 2);
          
          const scale = Math.min(slotWidth / width, slotHeight / height);
          const x = margin + col * (slotWidth + gap) + (slotWidth - width * scale) / 2;
          const y = A4[1] - margin - (row + 1) * slotHeight - row * gap + (slotHeight - height * scale) / 2;
          
          const embeddedPage = await newPdf.embedPage(sourcePage);
          newPage.drawPage(embeddedPage, {
            x,
            y,
            width: width * scale,
            height: height * scale,
          });

          // Add border around the page
          newPage.drawRectangle({
            x,
            y,
            width: width * scale,
            height: height * scale,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 0.5,
          });
        }
      }
    } else if (mode === "image-pdf") {
      if (!pdfjsLib) throw new Error("PDF.js not loaded");
      
      const loadedPdfjsDocs: Record<string, any> = {};
      const getPdfjsDoc = async (fileId: string) => {
        if (loadedPdfjsDocs[fileId]) return loadedPdfjsDocs[fileId];
        const fileItem = pdfFiles.find(f => f.id === fileId);
        if (!fileItem) throw new Error("File not found");
        // Slice arrayBuffer to prevent detachment
        const doc = await pdfjsLib.getDocument({ data: fileItem.arrayBuffer.slice(0) }).promise;
        loadedPdfjsDocs[fileId] = doc;
        return doc;
      };

      for (let i = 0; i < pages.length; i++) {
        const pageInfo = pages[i];
        const pdfjsDoc = await getPdfjsDoc(pageInfo.fileId);
        const page = await pdfjsDoc.getPage(pageInfo.originalIndex + 1);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          const imageDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer());
          const image = await newPdf.embedJpg(imageBytes);
          const newPage = newPdf.addPage([viewport.width, viewport.height]);
          newPage.drawImage(image, { x: 0, y: 0, width: viewport.width, height: viewport.height });
        }
      }
    }
    
    return await newPdf.save();
  };

  const handleContinueToPreview = async () => {
    if (pdfFiles.length === 0 || pages.length === 0) return;
    setIsLoading(true);
    try {
      const pdfBytes = await getModifiedPdf();
      if (!pdfBytes) return;
      
      const newFile = new File([pdfBytes as any], pdfFiles[0].name, { type: "application/pdf" });
      await processPdf(newFile);
      setShowPreview(true);
      toast.success("Değişiklikler uygulandı.");
    } catch (err) {
      console.error("Error preparing preview:", err);
      toast.error("İşlem yapılırken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadModifiedPdf = async () => {
    if (pdfFiles.length === 0 || pages.length === 0) return;
    
    setIsLoading(true);
    try {
      const pdfBytes = await getModifiedPdf();
      if (!pdfBytes) return;
      
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      let prefix = "edited_";
      if (mode === "image-pdf") prefix = "image_";
      else if (mode === "compress") prefix = `compressed_${compressLevel}_`;
      else if (mode === "6-to-1") prefix = "6in1_";
      
      link.download = `${prefix}${pdfFiles[0].name}`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("PDF başarıyla kaydedildi!");
    } catch (err) {
      console.error("Error saving PDF:", err);
      toast.error("PDF kaydedilirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectNewMode = (newMode: ToolMode) => {
    setMode(newMode);
    setShowPreview(false);
  };

  const reset = () => {
    setPdfFiles([]);
    setPages([]);
    setMode(null);
    setShowPreview(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getSourceFileName = (fileId: string) => {
    const file = pdfFiles.find(f => f.id === fileId);
    return file ? file.name : "";
  };

  const getModeLabel = () => {
    switch(mode) {
      case "rearrange": return "Düzenleme & Birleştirme";
      case "compress": return "Sıkıştırma";
      case "6-to-1": return "6 Sayfa";
      case "image-pdf": return "Görsel PDF";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col">
      <Toaster position="top-center" />
      
      {/* Header - Simple and Clean */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (showPreview) {
                  setShowPreview(false);
                } else if (mode !== null && pdfFiles.length === 0) {
                  setMode(null);
                } else {
                  window.location.href = getAppRootUrl();
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors animate-pulse"
            >
              <CaretLeft size={24} weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <FilePdf size={28} weight="fill" className="text-[#E03131]" />
                PDF TOOLS
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Safe & Local PDF Editor
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 pb-32">
        {mode === null && !showPreview ? (
          /* Selection Screen First */
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900 mb-2">Ne Yapmak İstersiniz?</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Başlamak için bir işlem seçin</p>
            </div>

            {/* 4 Columns layout, rounded-2xl, soft hover colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => setMode("rearrange")}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-200 hover:bg-red-50/20 transition-all duration-300 group text-left flex flex-col justify-between min-h-[220px]"
              >
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-[#E03131] group-hover:scale-105 transition-transform">
                  <SquaresFour size={24} weight="fill" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-gray-900 mb-1.5">Düzenle & Birleştir</h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    Sayfaları sıralayın, silin veya PDF'leri birleştirin.
                  </p>
                </div>
              </button>

              <button 
                onClick={() => setMode("compress")}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 hover:bg-amber-50/20 transition-all duration-300 group text-left flex flex-col justify-between min-h-[220px]"
              >
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
                  <FileArrowDown size={24} weight="fill" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-gray-900 mb-1.5">PDF Sıkıştır</h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    Çözünürlük ve kalite düşürerek dosya boyutunu azaltır.
                  </p>
                </div>
              </button>

              <button 
                onClick={() => setMode("6-to-1")}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 hover:bg-emerald-50/20 transition-all duration-300 group text-left flex flex-col justify-between min-h-[220px]"
              >
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 group-hover:scale-105 transition-transform">
                  <SquaresFour size={24} weight="fill" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-gray-900 mb-1.5">6 Sayfa Tek Sayfa</h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">6 sayfayı tek sayfada birleştirir (2x3).</p>
                </div>
              </button>

              <button 
                onClick={() => setMode("image-pdf")}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 hover:bg-indigo-50/20 transition-all duration-300 group text-left flex flex-col justify-between min-h-[220px]"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 group-hover:scale-105 transition-transform">
                  <ImageIcon size={24} weight="fill" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-gray-900 mb-1.5">Görsel PDF</h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">Sayfaları resme çevirir. Metinler seçilemez hale gelir.</p>
                </div>
              </button>
            </div>
          </motion.div>
        ) : pdfFiles.length === 0 && !showPreview ? (
          /* Show PDF Upload Screen second */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[60vh] flex flex-col items-center justify-center"
          >
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-md aspect-square bg-white border-4 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-[#E03131]/30 hover:bg-[#E03131]/5 transition-all group"
            >
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:text-[#E03131] group-hover:scale-105 transition-all">
                <Upload size={40} weight="bold" />
              </div>
              <div className="text-center px-6">
                <p className="text-lg font-black uppercase tracking-tight text-gray-900">PDF Yükle</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {getModeLabel()} işlemi için dosya seçin
                </p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />
            </div>
            
            <button 
              onClick={() => setMode(null)}
              className="mt-6 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-2"
            >
              <CaretLeft size={16} weight="bold" /> Seçeneklere Geri Dön
            </button>
          </motion.div>
        ) : showPreview ? (
          /* PREVIEW SCREEN */
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Header control block for Preview */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Önizleme Raporu</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                  Hazırlanan Belge: {pdfFiles[0].name} ({pages.length} Sayfa)
                </p>
              </div>
              
              <button
                onClick={reset}
                className="p-2.5 self-end sm:self-auto bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors cursor-pointer text-xs font-black uppercase tracking-widest flex items-center gap-2"
                title="Tümünü Sıfırla"
              >
                <X size={16} weight="bold" /> Sıfırla
              </button>
            </div>

            {/* Read-Only non-draggable grid of pages */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {pages.map((page, index) => (
                <div key={page.id} className="relative flex flex-col items-center">
                  <div className="relative w-full aspect-[3/4] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <img
                      src={page.imageDataUrl}
                      alt={`Page ${index + 1}`}
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Central big download action */}
            <div className="text-center py-10 border-y border-gray-100 my-8">
               <button 
                onClick={downloadModifiedPdf}
                disabled={isLoading}
                className="bg-gray-900 hover:bg-gray-800 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 mx-auto cursor-pointer"
               >
                 {isLoading ? (
                   <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                 ) : (
                   <Download size={24} weight="bold" />
                 )}
                 PDF Olarak İndir
               </button>
            </div>

            {/* Action Chaining cards: Bunlarla devam et */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-1">Bu Belgeyle Devam Edin</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aşağıdaki işlemlerden birini seçerek düzenlemeye devam edebilirsiniz</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => handleSelectNewMode("rearrange")}
                  className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-200 hover:bg-red-50/10 transition-all duration-300 group text-left flex flex-col justify-between min-h-[160px]"
                >
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-[#E03131]">
                    <SquaresFour size={20} weight="fill" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-gray-900 mb-1">Düzenle & Birleştir</h4>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">Sayfaları düzenle/birleştir.</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleSelectNewMode("compress")}
                  className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 hover:bg-amber-50/10 transition-all duration-300 group text-left flex flex-col justify-between min-h-[160px]"
                >
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500">
                    <FileArrowDown size={20} weight="fill" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-gray-900 mb-1">PDF Sıkıştır</h4>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">Dosya boyutunu düşür.</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleSelectNewMode("6-to-1")}
                  className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 hover:bg-emerald-50/10 transition-all duration-300 group text-left flex flex-col justify-between min-h-[160px]"
                >
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500">
                    <SquaresFour size={20} weight="fill" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-gray-900 mb-1">6 Sayfa Tek Sayfa</h4>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">Sayfaları 2x3 birleştirir.</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleSelectNewMode("image-pdf")}
                  className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 hover:bg-indigo-50/10 transition-all duration-300 group text-left flex flex-col justify-between min-h-[160px]"
                >
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">
                    <ImageIcon size={20} weight="fill" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-gray-900 mb-1">Görsel PDF</h4>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">Resim PDF olarak kaydet.</p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Editor Workspaces (Rearrange, Compress, etc.) */
          <div className="space-y-8">
            {/* File Info / Action Panel */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  mode === 'rearrange' ? 'bg-red-50 text-[#E03131]' : 
                  mode === '6-to-1' ? 'bg-emerald-50 text-emerald-500' :
                  mode === 'compress' ? 'bg-amber-50 text-amber-500' :
                  'bg-indigo-50 text-indigo-500'
                }`}>
                  {mode === 'rearrange' ? <SquaresFour size={28} weight="fill" /> : 
                   mode === '6-to-1' ? <SquaresFour size={28} weight="fill" /> :
                   mode === 'compress' ? <FileArrowDown size={28} weight="fill" /> :
                   <ImageIcon size={28} weight="fill" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-gray-900 truncate max-w-[150px] sm:max-w-md uppercase tracking-tight">
                      {pdfFiles[0].name} {pdfFiles.length > 1 && `+ ${pdfFiles.length - 1} dosya`}
                    </h3>
                    <span className="text-[8px] font-black px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 uppercase tracking-widest">
                      {getModeLabel()}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {pages.length} Sayfa Seçili
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={handleContinueToPreview}
                  disabled={isLoading || pages.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-sm active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Devam Et
                  <CaretRight size={16} weight="bold" />
                </button>

                <button
                  onClick={reset}
                  className="p-2.5 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Sıfırla / Kapat"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
            </div>

            {mode === "rearrange" ? (
              /* Rearrange & Merge Mode */
              isLoading && pages.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-[#E03131] rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Sayfalar Hazırlanıyor...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex gap-4">
                    <div className="text-indigo-500 shrink-0"><Info size={24} weight="fill" /></div>
                    <p className="text-xs font-bold text-indigo-900 uppercase tracking-wide leading-relaxed">
                      Sayfaları sürükleyerek sıralarını değiştirebilirsiniz. Listeye başka bir PDF eklemek için en sondaki "PDF Ekle" kutusunu kullanın.
                    </p>
                  </div>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={pages.map((p) => p.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                        {pages.map((page, index) => (
                          <SortablePage
                            key={page.id}
                            page={page}
                            index={index}
                            onDelete={handleDeletePage}
                            fileName={getSourceFileName(page.fileId)}
                          />
                        ))}

                        {/* Add PDF Card */}
                        <div 
                          onClick={() => appendFileInputRef.current?.click()}
                          className="relative group flex flex-col items-center cursor-pointer"
                        >
                          <div className="w-full aspect-[3/4] bg-white rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 hover:border-[#E03131]/40 hover:bg-[#E03131]/5 transition-all">
                            <div className="w-10 h-10 rounded-full bg-[#E03131]/5 text-[#E03131] flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Plus size={20} weight="bold" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 group-hover:text-[#E03131] transition-colors">
                              PDF Ekle
                            </span>
                          </div>
                          <input 
                            type="file" 
                            ref={appendFileInputRef}
                            onChange={handleAppendFileChange}
                            accept="application/pdf"
                            className="hidden"
                          />
                        </div>
                      </div>
                    </SortableContext>
                    
                    <DragOverlay adjustScale={true}>
                      {activeId ? (
                        <div className="w-full aspect-[3/4] bg-white rounded-xl shadow-2xl border-2 border-[#E03131] overflow-hidden opacity-90 scale-105">
                          <img
                            src={pages.find((p) => p.id === activeId)?.imageDataUrl}
                            alt="Dragging"
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </div>
              )
            ) : mode === "compress" ? (
              /* Compress Mode Setup */
              <div className="space-y-8 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-2">Sıkıştırma Seviyesi</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Çözünürlük ve resim kalitesini ayarlayın.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(["low", "medium", "high"] as const).map((level) => {
                    const levelMeta = {
                      low: {
                        title: "Düşük",
                        desc: "Maksimum kalite, az sıkıştırma",
                        activeBg: "bg-indigo-50/50 border-indigo-300 text-indigo-600",
                      },
                      medium: {
                        title: "Orta",
                        desc: "Dengeli çözünürlük & kalite",
                        activeBg: "bg-amber-50/50 border-amber-300 text-amber-600",
                      },
                      high: {
                        title: "Yüksek",
                        desc: "En küçük dosya boyutu, düşük kalite",
                        activeBg: "bg-red-50/50 border-red-300 text-red-600",
                      }
                    }[level];

                    const isActive = compressLevel === level;

                    return (
                      <button
                        key={level}
                        onClick={() => setCompressLevel(level)}
                        className={`p-6 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          isActive ? levelMeta.activeBg : "border-gray-100 hover:border-gray-200 bg-white"
                        }`}
                      >
                        <span className="text-sm font-black uppercase tracking-wider block mb-1 text-gray-900">
                          {levelMeta.title}
                        </span>
                        <span className="text-xs text-gray-500 block leading-relaxed font-medium">
                          {levelMeta.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : mode === "6-to-1" ? (
              /* 6-to-1 Mode Preview */
              <div className="space-y-8">
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex gap-4">
                  <div className="text-emerald-500 shrink-0"><Info size={24} weight="fill" /></div>
                  <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide leading-relaxed">
                    Bu işlem her 6 sayfayı tek bir A4 sayfasına (2x3 düzeninde) yerleştirecektir. Sayfalara ince bir çerçeve eklenecektir.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
                  {Array.from({ length: Math.ceil(pages.length / 6) }).map((_, pageIdx) => (
                    <div key={pageIdx} className="relative">
                      <div className="absolute -top-6 left-0 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Yeni Sayfa {pageIdx + 1}
                      </div>
                      <div className="aspect-[1/1.414] bg-white rounded-2xl border border-gray-200 shadow-sm p-[5%] grid grid-cols-2 grid-rows-3 gap-[2%]">
                        {pages.slice(pageIdx * 6, pageIdx * 6 + 6).map((page, idx) => (
                          <div key={page.id} className="border border-[0.5px] border-gray-200 rounded-sm overflow-hidden flex items-center justify-center p-0.5 animate-pulse bg-gray-50">
                            <img src={page.imageDataUrl} className="w-full h-full object-contain" alt="" />
                          </div>
                        ))}
                        {/* Empty slots if less than 6 pages */}
                        {Array.from({ length: Math.max(0, 6 - pages.slice(pageIdx * 6, pageIdx * 6 + 6).length) }).map((_, idx) => (
                          <div key={`empty-${idx}`} className="border border-dashed border-gray-200 rounded-sm" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Image PDF Mode Preview */
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex gap-4">
                  <div className="text-amber-500 shrink-0"><Info size={24} weight="fill" /></div>
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wide leading-relaxed">
                    Bu işlem her sayfayı bir resme dönüştürecektir. Sonuç olarak metinler seçilemez ve aranamaz hale gelir. PDF boyutu artabilir.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 opacity-60">
                  {pages.map((page, index) => (
                    <div key={page.id} className="aspect-[3/4] bg-white rounded-xl border border-gray-200 overflow-hidden p-2">
                       <img src={page.imageDataUrl} className="w-full h-full object-contain" alt="" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {pages.length === 0 && !isLoading && (
              <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hiç sayfa kalmadı</p>
                <button onClick={reset} className="mt-4 text-[#E03131] text-xs font-black uppercase tracking-widest cursor-pointer">Sıfırla</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
