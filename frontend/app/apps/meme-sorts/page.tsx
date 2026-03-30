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
  Crown
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

type SortAlgorithm = 'bogo' | 'stalin' | 'thanos' | 'sleep' | 'miracle' | 'trump';

interface SortInfo {
  name: string;
  description: string;
  icon: any;
  color: string;
  complexity: string;
  code: string;
}

const ALGORITHMS: Record<SortAlgorithm, SortInfo> = {
  bogo: {
    name: "BogoSort",
    description: "Randomly shuffles elements until they are sorted. Potentially outlives the universe.",
    complexity: "O(n!)",
    color: "#FF6B6B",
    icon: Ghost,
    code: `function bogoSort(arr) {
  while (!isSorted(arr)) {
    shuffle(arr);
  }
  return arr; // Good luck.
}`
  },
  stalin: {
    name: "StalinSort",
    description: "An efficient sort where elements that don't fall in order are simply 'eliminated'.",
    complexity: "O(n)",
    color: "#E03131",
    icon: Skull,
    code: `function stalinSort(arr) {
  return arr.filter((val, i) => 
    i === 0 || val >= arr[i-1]
  );
}`
  },
  thanos: {
    name: "ThanosSort",
    description: "Randomly snaps half the universe away. If still unsorted, it snaps again.",
    complexity: "O(log n)",
    color: "#BE4BDB",
    icon: Sparkle,
    code: `function thanosSort(arr) {
  while (!isSorted(arr)) {
    arr = arr.slice(0, arr.length / 2);
    // Perfectly balanced.
  }
  return arr;
}`
  },
  sleep: {
    name: "SleepSort",
    description: "Each element sleeps for its value duration. The ones that wake up first are added.",
    complexity: "O(max(n))",
    color: "#FCC419",
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
    complexity: "O(faith)",
    color: "#339AF0",
    icon: ShieldCheck,
    code: `function miracleSort(arr) {
  // Wait for a miracle...
  while (!isSorted(arr)) {
    /* Just believe */
  }
  return arr;
}`
  },
  trump: {
    name: "TrumpSort",
    description: "The best sort. Nobody sorts better. Believe me. Tremendous results.",
    complexity: "O(tremendous)",
    color: "#FF922B",
    icon: Crown,
    code: `function trumpSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    swap(arr, i, Math.floor(Math.random() * arr.length));
  }
  return arr; // sorted. the best. ever.
}`
  }
};

const MAX_VALUE = 100;

export default function MemeSorts() {
  const router = useRouter();
  const [array, setArray] = useState<number[]>([]);
  const [selectedAlg, setSelectedAlg] = useState<SortAlgorithm>('stalin');
  const [isSorting, setIsSorting] = useState(false);
  const [logs, setLogs] = useState<string[]>(["System ready. Choose an algorithm."]);
  const [initialSize, setInitialSize] = useState(8);

  useEffect(() => {
    const handleResize = () => {
      const size = window.innerWidth >= 1024 ? 16 : 8;
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
    setLogs(["New universe initialized."]);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 8));
  };

  const isSorted = (arr: number[]) => {
    for (let i = 0; i < arr.length - 1; i++) {
       if (arr[i] > arr[i + 1]) return false;
    }
    return true;
  };

  const runSort = async () => {
    if (isSorting) return;
    setIsSorting(true);
    let currentArray = [...array];

    switch (selectedAlg) {
      case 'bogo':
        addLog("BogoSort: Shuffling into chaos...");
        let attempts = 0;
        while (!isSorted(currentArray) && attempts < 50) {
          currentArray = [...currentArray].sort(() => Math.random() - 0.5);
          setArray(currentArray);
          attempts++;
          addLog(`Attempt #${attempts}...`);
          await new Promise(r => setTimeout(r, 100));
        }
        break;

      case 'stalin':
        addLog("StalinSort: Purging non-conformists...");
        const stalinResult: number[] = [currentArray[0]];
        for (let i = 1; i < currentArray.length; i++) {
          if (currentArray[i] >= stalinResult[stalinResult.length - 1]) {
            stalinResult.push(currentArray[i]);
          } else {
            addLog(`Value ${currentArray[i]} eliminated!`);
            currentArray[i] = -1;
            setArray([...currentArray]);
            await new Promise(r => setTimeout(r, 300));
          }
        }
        setArray(stalinResult);
        break;

      case 'thanos':
        addLog("Thanos: Maintaining balance...");
        while (!isSorted(currentArray) && currentArray.length > 1) {
          const cutIndex = Math.floor(currentArray.length / 2);
          addLog("SNAP!");
          currentArray = currentArray.slice(0, currentArray.length - cutIndex);
          setArray(currentArray);
          await new Promise(r => setTimeout(r, 600));
        }
        break;

      case 'sleep':
        addLog("SleepSort: Nap time begins...");
        const results: number[] = [];
        const sleepArray = [...currentArray];
        await Promise.all(sleepArray.map(async (val) => {
          await new Promise(r => setTimeout(r, val * 20));
          results.push(val);
          setArray([...results]);
        }));
        break;

      case 'miracle':
        addLog("MiracleSort: Waiting for intervention...");
        await new Promise(r => setTimeout(r, 3000));
        break;

      case 'trump':
        addLog("TrumpSort: Tremendous sorting happening...");
        for (let i = 0; i < currentArray.length; i++) {
          const rand = Math.floor(Math.random() * currentArray.length);
          [currentArray[i], currentArray[rand]] = [currentArray[rand], currentArray[i]];
          setArray([...currentArray]);
          addLog(`Perfect swap #${i+1}`);
          await new Promise(r => setTimeout(r, 200));
        }
        addLog("It's beautiful. Sorted. The best.");
        break;
    }
    setIsSorting(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0F172A] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-6 bg-[#1E293B]/50 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-4 max-w-6xl mx-auto w-full">
          <button onClick={() => router.back()} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
            <ArrowLeft size={20} weight="bold" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight">Meme Sorts</h1>
            <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold opacity-70">Visualizer v1.0</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Visualizer */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#1E293B] rounded-[3rem] p-8 min-h-[450px] flex flex-col items-center justify-end relative overflow-hidden border border-white/5 shadow-2xl">
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
               
               <div className="flex items-end justify-center gap-3 w-full h-[320px] mb-8 relative z-10">
                 <AnimatePresence mode="popLayout">
                   {array.map((val, idx) => (
                     val !== -1 && (
                       <motion.div
                        key={`${idx}-${val}`}
                        layout
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0, y: 50 }}
                        className="flex flex-col items-center gap-2 flex-1 max-w-[45px]"
                       >
                         <div 
                           className="w-full rounded-t-2xl rounded-b-lg"
                           style={{ 
                             height: `${(val / MAX_VALUE) * 260}px`,
                             backgroundColor: ALGORITHMS[selectedAlg].color,
                             boxShadow: `0 10px 40px -10px ${ALGORITHMS[selectedAlg].color}AA` 
                           }}
                         />
                         <span className="text-[10px] font-black text-gray-500">{val}</span>
                       </motion.div>
                     )
                   ))}
                 </AnimatePresence>
               </div>

               <div className="text-center bg-black/20 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 w-full">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <span className="text-[10px] font-black bg-white/5 px-3 py-1 rounded-full border border-white/5 text-indigo-300">
                      {ALGORITHMS[selectedAlg].complexity}
                    </span>
                  </div>
                  <h3 className="text-lg font-black mb-1">{ALGORITHMS[selectedAlg].name}</h3>
                  <p className="text-gray-400 text-sm max-w-lg mx-auto">{ALGORITHMS[selectedAlg].description}</p>
               </div>
            </div>

            {/* Code Snippet Box (The requested feature) */}
            <motion.div 
              key={selectedAlg}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 shadow-xl overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4 opacity-30">
                <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
              </div>
              <pre className="font-mono text-[13px] text-gray-800 leading-relaxed overflow-x-auto">
                <code className="language-javascript">
                  {ALGORITHMS[selectedAlg].code.split('\n').map((line, i) => (
                    <div key={i} className="flex">
                      <span className="w-8 text-gray-300 select-none">{i + 1}</span>
                      <span className="flex-1 whitespace-pre">{line}</span>
                    </div>
                  ))}
                </code>
              </pre>
            </motion.div>
          </div>

          {/* RIGHT: Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="hidden lg:grid grid-cols-1 gap-2">
              {(Object.keys(ALGORITHMS) as SortAlgorithm[]).map((key) => {
                const isSelected = selectedAlg === key;
                const AlgIcon = ALGORITHMS[key].icon;
                return (
                  <button
                    key={key}
                    onClick={() => !isSorting && setSelectedAlg(key)}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                      isSelected ? "bg-indigo-600/10 border-indigo-500/40" : "bg-[#1E293B] border-transparent hover:bg-white/5"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-indigo-600' : 'bg-white/5'}`}>
                      <AlgIcon size={20} weight={isSelected ? "fill" : "bold"} color="white" />
                    </div>
                    <span className="text-sm font-black flex-1 text-left">{ALGORITHMS[key].name}</span>
                  </button>
                )
              })}
            </div>

            <div className="bg-black/60 rounded-[2.5rem] p-8 font-mono text-[11px] border border-white/5 h-[300px] shadow-inner flex flex-col">
              <div className="flex items-center gap-4 mb-6 opacity-50">
                <span className="text-[10px] font-black tracking-widest uppercase">Console.log</span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
                {logs.map((log, i) => (
                  <div key={i} className={i === 0 ? "text-indigo-400 font-bold" : "text-gray-500"}>
                    <span className="text-indigo-900 mr-3">❯</span>
                    {log}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={generateNewArray} disabled={isSorting} className="flex-1 bg-[#1E293B] hover:bg-white/10 py-5 rounded-3xl font-black border border-white/5">
                <ArrowClockwise size={20} weight="bold" className="mx-auto" />
              </button>
              <button onClick={runSort} disabled={isSorting} className="flex-[3] bg-indigo-600 hover:bg-indigo-700 py-5 rounded-3xl font-black shadow-2xl shadow-indigo-500/40">
                {isSorting ? "WORKING..." : "RUN SORT"}
              </button>
            </div>
          </div>
        </div>
      </main>
      <div className="h-20 sm:hidden"></div>
    </div>
  );
}
