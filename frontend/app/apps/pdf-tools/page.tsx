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
  Plus,
  Info,
  X,
  SquaresFour,
  Image as ImageIcon
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { PDFDocument } from "pdf-lib";
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
type ToolMode = "rearrange" | "image-pdf" | null;

interface PdfPage {
  id: string; // unique id for dnd
  originalIndex: number;
  imageDataUrl: string;
}

// Sortable Item Component
function SortablePage({ 
  page, 
  onDelete, 
  index 
}: { 
  page: PdfPage; 
  onDelete: (id: string) => void;
  index: number;
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
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [mode, setMode] = useState<ToolMode>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      processPdf(file);
    } else if (file) {
      toast.error("Lütfen geçerli bir PDF dosyası seçin.");
    }
  };

  const processPdf = async (file: File) => {
    if (!pdfjsLib) return;
    
    setIsLoading(true);
    setPdfFile(file);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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
          });
        }
      }
      
      setPages(loadedPages);
      toast.success(`${pdf.numPages} sayfa yüklendi.`);
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

  const downloadModifiedPdf = async () => {
    if (!pdfFile || pages.length === 0) return;
    
    setIsLoading(true);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();
      
      if (mode === "rearrange") {
        const pageIndices = pages.map(p => p.originalIndex);
        const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));
      } else if (mode === "image-pdf") {
        // For each page, we'll render it as a high-quality image and embed it
        if (!pdfjsLib) throw new Error("PDF.js not loaded");
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        for (let i = 0; i < pages.length; i++) {
          const pageInfo = pages[i];
          const page = await pdf.getPage(pageInfo.originalIndex + 1);
          
          // Higher scale for better quality in the final PDF
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({
              canvasContext: context,
              viewport: viewport,
            }).promise;
            
            const imageDataUrl = canvas.toDataURL("image/jpeg", 0.85);
            const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer());
            const image = await newPdf.embedJpg(imageBytes);
            
            const newPage = newPdf.addPage([viewport.width, viewport.height]);
            newPage.drawImage(image, {
              x: 0,
              y: 0,
              width: viewport.width,
              height: viewport.height,
            });
          }
        }
      }
      
      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${mode === "image-pdf" ? "image_" : "edited_"}${pdfFile.name}`;
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

  const reset = () => {
    setPdfFile(null);
    setPages([]);
    setMode(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.location.href = getAppRootUrl()}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <CaretLeft size={24} weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <FilePdf size={28} weight="fill" className="text-[#E03131]" />
                Pdf <span className="text-[#E03131]">Tools</span>
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Safe & Local PDF Editor
              </p>
            </div>
          </div>
          
          {pdfFile && (
            <div className="flex items-center gap-2">
              <button
                onClick={reset}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Sıfırla"
              >
                <X size={20} weight="bold" />
              </button>
              <button
                onClick={downloadModifiedPdf}
                disabled={isLoading || pages.length === 0}
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                <Download size={18} weight="bold" />
                İndir
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 pb-32">
        {!pdfFile ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[60vh] flex flex-col items-center justify-center"
          >
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-md aspect-square bg-white border-4 border-dashed border-gray-200 rounded-[3rem] flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-[#E03131]/30 hover:bg-[#E03131]/5 transition-all group"
            >
              <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 group-hover:text-[#E03131] group-hover:scale-110 transition-all">
                <Upload size={48} weight="bold" />
              </div>
              <div className="text-center">
                <p className="text-lg font-black uppercase tracking-tight text-gray-900">PDF Yükle</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Dosyayı buraya sürükle veya tıkla</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />
            </div>
            
          </motion.div>
        ) : !mode ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900 mb-2">Ne Yapmak İstersiniz?</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Yüklenen dosya: {pdfFile.name}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button 
                onClick={() => setMode("rearrange")}
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-500/20 transition-all group text-left flex flex-col gap-6"
              >
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                  <SquaresFour size={32} weight="fill" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-2">Sayfaları Düzenle</h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">Sayfaların sırasını değiştirin, gereksiz olanları silin.</p>
                </div>
              </button>

              <button 
                onClick={() => setMode("image-pdf")}
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#E03131]/20 transition-all group text-left flex flex-col gap-6"
              >
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-[#E03131] group-hover:scale-110 transition-transform">
                  <ImageIcon size={32} weight="fill" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-2">Görsel PDF'e Dönüştür</h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">Her sayfayı resme dönüştürüp tekrar birleştirir. Metin seçilemez hale gelir.</p>
                </div>
              </button>
            </div>

            <button 
              onClick={reset}
              className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-gray-600 transition-colors"
            >
              Farklı Dosya Yükle
            </button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* File Info */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${mode === 'rearrange' ? 'bg-indigo-50 text-indigo-500' : 'bg-red-50 text-[#E03131]'}`}>
                  {mode === 'rearrange' ? <SquaresFour size={28} weight="fill" /> : <ImageIcon size={28} weight="fill" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-gray-900 truncate max-w-[150px] sm:max-w-md uppercase tracking-tight">{pdfFile.name}</h3>
                    <span className="text-[8px] font-black px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 uppercase tracking-widest">
                      {mode === 'rearrange' ? 'Düzenleme' : 'Görsel PDF'}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {pages.length} Sayfa Seçili
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMode(null)}
                  className="p-3 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-100 transition-colors"
                  title="Mod Değiştir"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
            </div>

            {mode === "rearrange" ? (
              /* Rearrange Mode */
              isLoading && pages.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-[#E03131] rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Sayfalar Hazırlanıyor...</p>
                </div>
              ) : (
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
                        />
                      ))}
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
              )
            ) : (
              /* Image PDF Mode Preview */
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex gap-4">
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
                
                <div className="text-center py-12">
                   <button 
                    onClick={downloadModifiedPdf}
                    disabled={isLoading}
                    className="bg-gray-900 text-white px-12 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 mx-auto"
                   >
                     {isLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Download size={24} weight="bold" />}
                     Görsel PDF Olarak İndir
                   </button>
                </div>
              </div>
            )}
            
            {pages.length === 0 && !isLoading && (
              <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hiç sayfa kalmadı</p>
                <button onClick={reset} className="mt-4 text-[#E03131] text-xs font-black uppercase tracking-widest">Sıfırla</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
