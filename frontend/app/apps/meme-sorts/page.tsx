"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Play, 
  ArrowClockwise, 
  Skull, 
  ShieldCheck, 
  Lightning, 
  Sparkle, 
  Ghost, 
  ChartBar, 
  Crown, 
  CheckCircle 
} from "@phosphor-icons/react"; 
import { motion, AnimatePresence } from "framer-motion";

type SortAlgorithm = 'bogo' | 'stalin' | 'thanos' | 'sleep' | 'miracle' | 'trump';

interface SortInfo {
  name: string;
  description: string;
  finishMessage: string;
  icon: any;
  complexity: string;
  code: string;
}

const ALGORITHMS: Record<SortAlgorithm, SortInfo> = {
  bogo: {
    name: "BogoSort",
    description: "Randomly shuffles elements until they are sorted. Potentially outlives the universe.",
    finishMessage: "PURE LUCK! RNG gods have smiled upon you today.",
    complexity: "O(n!)",
    icon: Ghost,
    code: `function bogoSort(arr) {
  while (!isSorted(arr)) {
    shuffle(arr); // try luck
  }
}`
  },
  stalin: {
    name: "StalinSort",
    description: "An efficient sort where elements that don't fall in order are simply 'eliminated'.",
    finishMessage: "LOYALTY CONFIRMED. Non-conforming elements have been purged.",
    complexity: "O(n)",
    icon: Skull,
    code: `function stalinSort(arr) {
  return arr.filter((val, i) => 
    i === 0 || val >= arr[i-1]
  );
}`
  },
  thanos: {
    name: "ThanosSort",
    description: "Checks if the array is sorted. If not, it randomly turns half of the elements to dust. Repeats until perfectly balanced.",
    finishMessage: "PERFECTLY BALANCED. As all things should be.",
    complexity: "O(log n)",
    icon: Sparkle,
    code: `function thanosSort(arr) {
  while (!isSorted(arr)) {
    const half = arr.length / 2;
    for (let i = 0; i < half; i++) {
      const r = Math.random() * arr.length;
      arr.splice(r, 1); // dust
    }
  }
}`
  },
  sleep: {
    name: "SleepSort",
    description: "Each element sleeps for its value duration. The ones that wake up first are added.",
    finishMessage: "RISE AND SHINE! Everyone is finally wide awake.",
    complexity: "O(max(n))",
    icon: Lightning,
    code: `function sleepSort(arr) {
  arr.forEach(val => {
    setTimeout(() => print(val), val);
  });
}`
  },
  miracle: {
    name: "MiracleSort",
    description: "Does literally nothing. Waits for a miracle to occur and sort the array spontaneously.",
    finishMessage: "GLITCH IN THE MATRIX. A true miracle actually happened!",
    complexity: "O(faith)",
    icon: ShieldCheck,
    code: `function miracleSort(arr) {
  while (!isSorted(arr)) {
    /* Just believe */
  }
}`
  },
  trump: {
    name: "TrumpSort",
    description: "The best sort. Nobody sorts better. Believe me. Tremendous results.",
    finishMessage: "TREMENDOUS RESULTS. The best sorting in history. HUGE.",
    complexity: "O(tremendous)",
    icon: Crown,
    code: `function trumpSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    swap(arr, i, Math.random() * n);
  }
}`
  }
};

const MAX_VALUE = 100;
const BASE_COLOR = "#FFFFFF";
const ACTIVE_COLOR = "#FF765E"; 
const DELETE_COLOR = "#FF4D4D"; 

export default function MemeSorts() {
  const router = useRouter();
  const [array, setArray] = useState<number[]>([]);
  const [selectedAlg, setSelectedAlg] = useState<SortAlgorithm>('stalin');
  const [isSorting, setIsSorting] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [logs, setLogs] = useState<string[]>(["System ready. Choose an algorithm."]);
  const [activeIndices, setActiveIndices] = useState<number[]>([]);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [dustingIndices, setDustingIndices] = useState<number[]>([]);
  const [initialSize, setInitialSize] = useState(8);

  // Thanos dust particle colors
  const DUST_COLORS = ['#FF6B35', '#FF4444', '#FF8C42', '#E8430A', '#FF5722', '#D84315'];

  useEffect(() => {
    const handleResize = () => {
      const size = window.innerWidth >= 1024 ? 12 : 8;
      setInitialSize(size);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    generateNewArray();
  }, [initialSize]);

  const generateNewArray = () => {
    const newArray = Array.from({ length: initialSize }, () => Math.floor(Math.random() * MAX_VALUE) + 10);
    setArray(newArray);
    setIsSorting(false);
    setShowFinish(false);
    setActiveIndices([]);
    setDeletingIndex(null);
    setLogs(["New universe initialized."]);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 8));
  };

  const highlightCode = (code: string) => {
    return code
      .replace(/\b(function|while|return|for|let|const|if|else)\b/g, '<span style="color: #c586c0;">$1</span>')
      .replace(/\b(thanosSort|isSorted|Math|random|floor|splice|swap|print|setTimeout|shuffle|filter|forEach|push|slice)\b/g, '<span style="color: #dcdcaa;">$1</span>')
      .replace(/\s(\w+)(?=\()/g, ' <span style="color: #dcdcaa;">$1</span>')
      .replace(/\b(arr|i|j|val|half|r|attempts|currentArray|stalinResult)\b/g, '<span style="color: #9cdcfe;">$1</span>')
      .replace(/(\(|\)|\[|\]|\{|\})/g, '<span style="color: #ffd700;">$1</span>')
      .replace(/(\/\/.*$)/gm, '<span style="color: #6a9955;">$1</span>');
  };

  const playNote = (val: number, type: 'swap' | 'error' | 'snap' | 'success' | 'thud' = 'swap') => {
    try {
      // For real meme sounds from CDN
      const SOUNDS = {
        thud: "https://www.myinstants.com/media/sounds/vine-boom.mp3",
        snap: "/meme-sorts/thanos.mp3",
        success: "/meme-sorts/fanfare.mp3",
        error: "https://www.myinstants.com/media/sounds/stalin_tXf2sOn.mp3"
      };

      if (type !== 'swap') {
        const audio = new Audio((SOUNDS as any)[type]);
        audio.volume = 0.5; // Increased volume for capture
        audio.play().catch(e => console.log("Audio play blocked - wait for user interaction", e));
        return;
      }

      // Keep the synthetic beep only for fast swaps to avoid audio overhead
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      let frequency = 200 + (val / MAX_VALUE) * 600;
      let duration = 0.1;
      let volume = 0.05;

      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.error('Audio interaction failed', e);
    }
  };

  const isSorted = (arr: number[]) => {
    if (arr.length <= 1) return true;
    for (let i = 0; i < arr.length - 1; i++) {
       if (arr[i] > arr[i + 1]) return false;
    }
    return true;
  };

  const runSort = async () => {
    if (isSorting) return;
    setIsSorting(true);
    setShowFinish(false);
    let currentArray = [...array];

    switch (selectedAlg) {
      case 'bogo':
        addLog("BogoSort: Praying to RNG gods...");
        let attempts = 0;
        while (!isSorted(currentArray) && attempts < 15) {
          setActiveIndices(currentArray.map((_, i) => i));
          currentArray = [...currentArray].sort(() => Math.random() - 0.5);
          setArray(currentArray);
          playNote(currentArray[0]);
          attempts++;
          addLog(`Attempt #${attempts}...`);
          await new Promise(r => setTimeout(r, 600));
          setActiveIndices([]);
          await new Promise(r => setTimeout(r, 100));
        }
        break;

      case 'stalin':
        addLog("StalinSort: Eliminating deviants...");
        const stalinResult: number[] = [currentArray[0]];
        for (let i = 1; i < currentArray.length; i++) {
          setActiveIndices([i]);
          playNote(currentArray[i]);
          await new Promise(r => setTimeout(r, 400));
          if (currentArray[i] >= stalinResult[stalinResult.length - 1]) {
            stalinResult.push(currentArray[i]);
          } else {
            addLog(`${currentArray[i]} eliminated!`);
            setDeletingIndex(i);
            playNote(0, 'thud');
            await new Promise(r => setTimeout(r, 600));
            currentArray[i] = -1;
            setArray([...currentArray]);
            setDeletingIndex(null);
          }
          setActiveIndices([]);
        }
        setArray(stalinResult.filter(x => x !== -1));
        break;

      case 'thanos':
        addLog("Thanos: SNAPPING half away...");
        while (!isSorted(currentArray) && currentArray.length > 1) {
          const cutCount = Math.floor(currentArray.length / 2);
          const indicesToRemove = new Set<number>();
          while (indicesToRemove.size < cutCount) {
             indicesToRemove.add(Math.floor(Math.random() * currentArray.length));
          }
          
          setActiveIndices(Array.from(indicesToRemove));
          playNote(0, 'snap');
          await new Promise(r => setTimeout(r, 600));
          addLog("SNAP!");
          
          // Phase 1: Start dust particles
          setDustingIndices(Array.from(indicesToRemove));
          await new Promise(r => setTimeout(r, 1200));
          
          // Phase 2: Remove dusted elements
          currentArray = currentArray.filter((_, idx) => !indicesToRemove.has(idx));
          setArray(currentArray);
          setActiveIndices([]);
          setDustingIndices([]);
          await new Promise(r => setTimeout(r, 400));
        }
        break;

      case 'sleep':
        addLog("SleepSort: Goodnight...");
        const results: number[] = [];
        const sleepArray = [...currentArray];
        await Promise.all(sleepArray.map(async (val) => {
          await new Promise(r => setTimeout(r, val * 30));
          results.push(val);
          playNote(val);
          addLog(`${val} woke up!`);
          setArray([...results]);
        }));
        break;

      case 'miracle':
        addLog("MiracleSort: Just believe...");
        await new Promise(r => setTimeout(r, 4000));
        break;

      case 'trump':
        addLog("TrumpSort: Tremendous sorting...");
        for (let i = 0; i < currentArray.length; i++) {
          const rand = Math.floor(Math.random() * currentArray.length);
          setActiveIndices([i, rand]);
          playNote(currentArray[rand]);
          await new Promise(r => setTimeout(r, 600));
          [currentArray[i], currentArray[rand]] = [currentArray[rand], currentArray[i]];
          setArray([...currentArray]);
          addLog(`Perfect swap #${i+1}`);
          await new Promise(r => setTimeout(r, 300));
          setActiveIndices([]);
        }
        break;
    }
    
    setIsSorting(false);
    setActiveIndices([]);
    setDeletingIndex(null);
    setShowFinish(true);
    playNote(100, 'success');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0F172A] text-white overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-8 bg-[#0F172A] sticky top-0 z-40">
        <div className="flex items-center gap-6 max-w-6xl mx-auto w-full">
          <button onClick={() => router.back()} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
            <ArrowLeft size={24} weight="bold" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter uppercase">Meme Sorts</h1>
            <span className="text-[11px] uppercase tracking-[0.3em] text-indigo-400 font-bold opacity-70">Visualizer v1.0</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 sm:p-10 max-w-6xl mx-auto w-full space-y-12 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* LEFT: Visualizer */}
          <div className="lg:col-span-8 flex flex-col relative h-full">
            
            {/* FINISH OVERLAY */}
            <AnimatePresence>
              {showFinish && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="absolute inset-x-0 inset-y-0 z-50 flex items-center justify-center p-8 pointer-events-none"
                >
                  <div className="bg-indigo-600 rounded-2xl p-10 shadow-2xl shadow-indigo-500/50 flex flex-col items-center text-center max-w-sm pointer-events-auto border border-white/20 backdrop-blur-md">
                    <CheckCircle size={48} color="white" weight="fill" className="mb-6" />
                    <h2 className="text-2xl font-black mb-3 text-white italic tracking-tight">MISSION ACCOMPLISHED</h2>
                    <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-8">
                       {ALGORITHMS[selectedAlg].finishMessage}
                    </p>
                    <button 
                      onClick={() => setShowFinish(false)}
                      className="w-full bg-white text-indigo-600 py-4 rounded-xl font-black text-xs tracking-[0.2em] hover:bg-indigo-50 transition-colors uppercase"
                    >
                      Finish Process // OK
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`bg-[#1E293B] rounded-2xl p-10 min-h-[600px] flex flex-col items-center justify-end relative overflow-hidden border border-white/5 shadow-2xl transition-all duration-500 flex-1 ${showFinish ? 'blur-sm scale-[0.98] opacity-50' : ''}`}>
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
               
               <div className="flex items-end justify-center gap-4 w-full h-[320px] mb-12 relative z-10">
                 <AnimatePresence mode="popLayout">
                   {array.map((val, idx) => {
                     const isActive = activeIndices.includes(idx);
                     const isDeleting = deletingIndex === idx;
                     const isDusting = dustingIndices.includes(idx);
                     const barHeight = (val / MAX_VALUE) * 260;
                     return val !== -1 && (
                       <div
                        key={`${idx}-${val}`}
                        className="flex flex-col items-center gap-3 flex-1 relative"
                        style={{ maxWidth: '40px' }}
                       >
                         {/* Dust Particles - OUTSIDE opacity-controlled element */}
                         {isDusting && (
                           <div className="absolute inset-0 pointer-events-none overflow-visible z-50" style={{ bottom: 0, height: `${barHeight}px`, marginTop: 'auto' }}>
                             {Array.from({ length: 25 }).map((_, pIdx) => {
                               const randomX = (Math.random() - 0.5) * 200;
                               const randomY = -(Math.random() * 150 + 30);
                               const randomRotate = Math.random() * 360;
                               const randomDelay = Math.random() * 0.4;
                               const randomSize = Math.random() * 4 + 2;
                               const randomColor = DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)];
                               return (
                                 <motion.div
                                   key={pIdx}
                                   initial={{ 
                                     x: 0, 
                                     y: -(Math.random() * barHeight), 
                                     opacity: 1, 
                                     scale: 1,
                                     rotate: 0 
                                   }}
                                   animate={{ 
                                     x: randomX, 
                                     y: randomY - (Math.random() * barHeight), 
                                     opacity: 0, 
                                     scale: 0,
                                     rotate: randomRotate 
                                   }}
                                   transition={{ 
                                     duration: 0.8 + Math.random() * 0.5, 
                                     delay: randomDelay,
                                     ease: 'easeOut' 
                                   }}
                                   className="absolute rounded-sm"
                                   style={{
                                     width: randomSize,
                                     height: randomSize,
                                     backgroundColor: randomColor,
                                     bottom: Math.random() * barHeight,
                                     left: Math.random() * 20,
                                     boxShadow: `0 0 6px ${randomColor}88`
                                   }}
                                 />
                               );
                             })}
                           </div>
                         )}

                         {/* Bar + Label - this fades instantly */}
                         <motion.div
                           className="w-full flex flex-col items-center gap-3"
                           animate={{ opacity: isDusting ? 0 : 1 }}
                           transition={{ duration: 0 }}
                         >
                           <motion.div 
                             className="w-full rounded-t-lg rounded-b-sm"
                             animate={{
                               backgroundColor: isDusting ? ACTIVE_COLOR : (isDeleting ? DELETE_COLOR : (isActive ? ACTIVE_COLOR : BASE_COLOR)),
                               boxShadow: (isActive || isDeleting || isDusting) ? `0 0 30px ${isActive || isDusting ? ACTIVE_COLOR : DELETE_COLOR}88` : 'none'
                             }}
                             transition={{ duration: 0.3 }}
                             style={{ 
                               height: `${barHeight}px`,
                             }}
                           />
                           <span className={`text-[10px] font-black ${isActive || isDeleting || isDusting ? 'text-white' : 'text-gray-500'}`}>{val}</span>
                         </motion.div>
                       </div>
                     );
                   })}
                 </AnimatePresence>
               </div>

               <div className="text-center bg-black/60 backdrop-blur-xl p-8 rounded-2xl border border-white/5 w-full mt-auto">
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <span className="text-[11px] font-black bg-white/5 px-4 py-1.5 rounded-lg border border-white/5 text-indigo-300 tracking-widest uppercase">
                      {ALGORITHMS[selectedAlg].complexity}
                    </span>
                  </div>
                  <h3 className="text-xl font-black mb-2 tracking-tight uppercase">{ALGORITHMS[selectedAlg].name}</h3>
                  <p className="text-gray-400 text-sm max-w-lg mx-auto leading-relaxed mb-8">{ALGORITHMS[selectedAlg].description}</p>
                  
                  {/* Embedded Code Snippet with Highlighter */}
                  <div className="text-left bg-[#1E1E1E] rounded-xl p-6 border border-white/5 overflow-hidden shadow-2xl relative">
                    <div className="flex gap-1.5 absolute top-4 right-4 opacity-50">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                    </div>
                    <pre className="font-mono text-[11px] sm:text-[12px] leading-relaxed overflow-x-auto scrollbar-hide pt-2">
                      <code 
                        className="block whitespace-pre"
                        dangerouslySetInnerHTML={{ __html: highlightCode(ALGORITHMS[selectedAlg].code) }}
                      />
                    </pre>
                  </div>
               </div>
            </div>
          </div>

          {/* RIGHT PANEL (Desktop) */}
          <div className={`lg:col-span-4 flex flex-col gap-8 transition-all duration-500 ${showFinish ? 'blur-sm scale-[0.98] opacity-50' : ''}`}>
            
             <div className="bg-black/60 rounded-2xl p-8 font-mono text-[12px] border border-white/5 flex-1 shadow-inner flex flex-col overflow-hidden">
              <div className="flex items-center gap-4 mb-6 opacity-30">
                <span className="text-[11px] font-black tracking-[0.2em] uppercase">SYSTEM_LOGS</span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide">
                {logs.map((log, i) => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i} className={i === 0 ? "text-indigo-400 font-bold" : "text-gray-500"}>
                    <span className="text-indigo-900 mr-4 opacity-50 font-black">❯</span>
                    {log}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
               <button onClick={runSort} disabled={isSorting} className="flex-[3] bg-indigo-600 hover:bg-indigo-700 py-6 rounded-2xl font-black text-lg tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50">
                {isSorting ? "WORKING..." : "RUN SORT"}
              </button>
              <button onClick={generateNewArray} disabled={isSorting} className="flex-1 bg-[#1E293B] hover:bg-white/5 py-5 rounded-2xl font-bold border border-white/10 transition-all flex items-center justify-center">
                <ArrowClockwise size={22} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM SELECTION BAR (Non-fixed) */}
        <nav className={`mt-12 bg-[#1E293B] rounded-2xl p-6 border border-white/5 transition-all duration-500 ${showFinish ? 'opacity-20 blur-md pointer-events-none' : ''}`}>
          <span className="text-[11px] font-black tracking-[0.2em] uppercase text-gray-500 block mb-6 px-2">Algorithm Selector</span>
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-4">
            {(Object.keys(ALGORITHMS) as SortAlgorithm[]).map((key) => {
              const isSelected = selectedAlg === key;
              const AlgIcon = ALGORITHMS[key].icon;
              return (
                <button
                  key={key}
                  onClick={() => !isSorting && setSelectedAlg(key)}
                  disabled={isSorting}
                  className={`flex-shrink-0 flex items-center gap-4 px-8 py-5 rounded-xl transition-all border ${
                    isSelected ? "bg-white/10 border-white/20" : "bg-[#0F172A] border-transparent hover:bg-white/5"
                  } ${isSorting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`p-3 rounded-lg ${isSelected ? 'bg-indigo-600 shadow-xl' : 'bg-white/5'}`}>
                    <AlgIcon size={24} weight={isSelected ? "fill" : "bold"} color="white" />
                  </div>
                  <span className="text-base font-black tracking-tight whitespace-nowrap">{ALGORITHMS[key].name}</span>
                  {isSelected && <motion.div layoutId="selection-bubble" className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_#818cf8]" />}
                </button>
              )
            })}
          </div>
        </nav>
      </main>
      <div className="h-20 sm:hidden"></div>
    </div>
  );
}
