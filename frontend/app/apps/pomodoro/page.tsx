"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  ArrowClockwise,
  Coffee,
  Timer,
  Gear,
  CaretLeft,
  Wind,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from "@/contexts/LanguageContext";

const IceCube = ({
  index,
  progress,
  baseX,
  baseY,
  rotation,
  startAt,
  endAt,
  waterLevel,
}: {
  index: number;
  progress: number;
  baseX: number;
  baseY: number;
  rotation: number;
  startAt: number;
  endAt: number;
  waterLevel: number;
}) => {
  const duration = endAt - startAt;
  const cubeProgress = Math.max(
    0,
    Math.min(1, (progress - startAt) / duration)
  );

  const waterTopY = 228 - waterLevel * 150;
  const cubeCenterY = 150 + baseY + cubeProgress * 24;
  const isSubmerged = cubeCenterY > waterTopY;

  return (
    <motion.div
      animate={{
        scale: 0.65 - cubeProgress * 0.45,
        rotate: rotation + cubeProgress * 12,
        y: baseY + cubeProgress * 26,
        x: baseX,
        opacity: cubeProgress > 0.96 ? 0 : 1,
      }}
      transition={{ type: "spring", stiffness: 70, damping: 18 }}
      className="absolute z-10"
      style={{
        left: "50%",
        top: "50%",
        marginLeft: -78,
        marginTop: -78,
      }}
    >
      <svg width="156" height="156" viewBox="0 0 156 156" fill="none">
        <defs>
          <linearGradient
            id={`front-${index}`}
            x1="38"
            y1="38"
            x2="118"
            y2="124"
          >
            <stop
              offset="0%"
              stopColor="#FFFFFF"
              stopOpacity="0.95"
            />
            <stop
              offset="50%"
              stopColor="#DDF6FF"
              stopOpacity="0.86"
            />
            <stop
              offset="100%"
              stopColor="#9DDEFF"
              stopOpacity="0.62"
            />
          </linearGradient>

          <linearGradient
            id={`side-${index}`}
            x1="104"
            y1="45"
            x2="134"
            y2="124"
          >
            <stop
              offset="0%"
              stopColor="#B8EDFF"
              stopOpacity="0.62"
            />
            <stop
              offset="100%"
              stopColor="#69C8F1"
              stopOpacity="0.42"
            />
          </linearGradient>

          <linearGradient
            id={`top-${index}`}
            x1="50"
            y1="26"
            x2="122"
            y2="45"
          >
            <stop
              offset="0%"
              stopColor="#FFFFFF"
              stopOpacity="0.92"
            />
            <stop
              offset="100%"
              stopColor="#E4FAFF"
              stopOpacity="0.5"
            />
          </linearGradient>

          <radialGradient id={`core-${index}`} cx="50%" cy="52%" r="48%">
            <stop offset="0%" stopColor="white" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#7AD3F6" stopOpacity="0" />
          </radialGradient>

          <filter
            id={`shadow-${index}`}
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
          >
            <feDropShadow
              dx="0"
              dy="7"
              stdDeviation="6"
              floodColor="#8BD7F5"
              floodOpacity="0.25"
            />
          </filter>
        </defs>

        <g filter={`url(#shadow-${index})`}>
          <path
            d="M47 37 C53 28 63 25 75 26 L122 29 C131 30 137 36 133 44 L117 59 C113 64 105 66 95 65 L49 62 C39 61 36 52 42 45 Z"
            fill={`url(#top-${index})`}
            stroke="#F8FDFF"
            strokeOpacity="0.82"
            strokeWidth="2"
          />

          <path
            d="M116 58 L134 43 C138 50 138 61 137 74 L134 111 C133 123 126 132 115 135 L112 82 C111 72 112 63 116 58 Z"
            fill={`url(#side-${index})`}
            stroke="#E4F8FF"
            strokeOpacity="0.58"
            strokeWidth="1.5"
          />

          <rect
            x="39"
            y="50"
            width="77"
            height="77"
            rx="18"
            fill={`url(#front-${index})`}
            stroke="#F8FDFF"
            strokeOpacity="0.88"
            strokeWidth="3"
          />

          <rect
            x="50"
            y="61"
            width="55"
            height="55"
            rx="14"
            fill={`url(#core-${index})`}
          />

          <path
            d="M50 69 C52 60 60 56 71 56 L97 57"
            stroke="white"
            strokeOpacity="0.68"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          <path
            d="M60 85 C74 80 84 79 98 77"
            stroke="white"
            strokeOpacity="0.35"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />

          <circle cx="66" cy="85" r="3.8" fill="white" opacity="0.38" />
          <circle cx="94" cy="77" r="2.8" fill="white" opacity="0.42" />
          <circle cx="99" cy="103" r="4.6" fill="white" opacity="0.33" />
        </g>
      </svg>
    </motion.div>
  );
};

const HairDryer = () => (
  <motion.div
    initial={{ x: 300, y: -100, rotate: -20, opacity: 0 }}
    animate={{ x: 140, y: -80, rotate: -35, opacity: 1 }}
    exit={{ x: 300, y: -100, rotate: -20, opacity: 0 }}
    className="absolute z-40 pointer-events-none"
  >
    <div className="relative">
      {/* Enhanced Air Waves */}
      <div className="absolute -left-32 top-0 w-40 h-24 overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ x: 100, opacity: 0, scale: 0.5 }}
            animate={{ 
              x: -100, 
              opacity: [0, 0.8, 0], 
              scale: [0.5, 1.5, 0.8],
              y: [0, (i - 2) * 15, 0]
            }}
            transition={{ 
              duration: 0.6, 
              repeat: Infinity, 
              delay: i * 0.12,
              ease: "linear"
            }}
            className="absolute top-1/2 right-0 h-1 rounded-full blur-[1px]"
            style={{ 
              width: 40 + Math.random() * 40,
              backgroundColor: i % 2 === 0 ? "#FFEDD5" : "#FED7AA",
              top: `${20 + i * 15}%`
            }}
          />
        ))}
        {/* Heat Glow */}
        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 0.3, repeat: Infinity }}
          className="absolute inset-0 bg-orange-400/10 blur-xl rounded-full"
        />
      </div>

      <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
        {/* Handle */}
        <rect x="70" y="45" width="25" height="45" rx="8" fill="#475569" />
        {/* Main Body */}
        <path d="M30 15 H100 C110 15 115 22 115 30 V45 C115 53 110 60 100 60 H30 V15 Z" fill="#64748B" />
        {/* Nozzle */}
        <rect x="15" y="20" width="15" height="35" rx="4" fill="#334155" />
        {/* Back Grill */}
        <circle cx="105" cy="37.5" r="15" fill="#1E293B" />
        <path d="M95 37.5 H115 M105 27.5 V47.5" stroke="#475569" strokeWidth="2" />
        {/* Details */}
        <rect x="75" y="55" width="15" height="5" rx="2" fill="#EF4444" /> {/* Switch */}
        <path d="M35 25 H85" stroke="white" strokeOpacity="0.1" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  </motion.div>
);

export default function PomodoroPage() {
  const t = useTranslations("pomodoro");
  const [workTime, setWorkTime] = useState(25 * 60);
  const [breakTime, setBreakTime] = useState(5 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFastForward, setIsFastForward] = useState(false);
  const [drops, setDrops] = useState<{ id: number; x: number }[]>([]);

  const dropIdCounter = useRef(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        const speed = isFastForward ? 300 : 1;
        setTimeLeft((prev) => Math.max(0, prev - speed));

        const dropCount = isFastForward ? 3 : 1;
        const newDrops = Array.from({ length: dropCount }).map(() => ({
          id: dropIdCounter.current++,
          x: (Math.random() - 0.5) * 90,
        }));

        setDrops((prev) => [...prev.slice(-15), ...newDrops]);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      setIsFastForward(false);
      setShowControls(true);
      playAlarm();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, isFastForward]);

  useEffect(() => {
    if (isActive && !isFastForward) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      setShowControls(true);
    }

    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isActive, showControls, isFastForward]);

  const playAlarm = () => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime);

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.00001,
        audioCtx.currentTime + 1.5
      );

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1.5);
    } catch (e) {
      console.error("Audio failed", e);
    }
  };

  const handleScreenClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;

    if (!showControls) {
      setShowControls(true);
    } else {
      setIsActive(!isActive);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsFastForward(false);
    setTimeLeft(isBreak ? breakTime : workTime);
    setDrops([]);
  };

  const startBreak = () => {
    setIsBreak(true);
    setTimeLeft(breakTime);
    setIsActive(true);
    setIsFastForward(false);
    setDrops([]);
  };

  const startWork = () => {
    setIsBreak(false);
    setTimeLeft(workTime);
    setIsActive(true);
    setIsFastForward(false);
    setDrops([]);
  };

  const totalTime = isBreak ? breakTime : workTime;
  const progress = 1 - timeLeft / totalTime;

  const waterTopY = 228 - progress * 150;
  const waterHeight = 240 - waterTopY;

  return (
    <div
      onClick={handleScreenClick}
      className="flex flex-col items-center justify-center min-h-screen p-4 font-sans relative transition-colors duration-1000 cursor-pointer overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#F8FCFF_0%,#EEF6FD_45%,#EAF2F8_100%)]"
    >
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 pointer-events-none"
          >
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center pointer-events-auto">
              <Link
                href="/"
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
              >
                <CaretLeft size={24} />
                <span className="text-sm font-medium">{t("back")}</span>
              </Link>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Gear size={28} weight={showSettings ? "fill" : "regular"} />
              </button>
            </div>

            <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-8 pointer-events-auto">
              <div className="flex flex-col items-center gap-2">
                <h2 className="text-xl font-medium text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  {isBreak ? <Coffee weight="fill" /> : <Timer weight="fill" />}
                  {isBreak ? t("break") : t("focus")}
                </h2>

                <div className="text-slate-400 font-mono text-2xl font-light">
                  {Math.floor(timeLeft / 60)}:
                  {(timeLeft % 60).toString().padStart(2, "0")}
                </div>
              </div>

              <div className="flex items-center gap-8">
                {timeLeft > 0 ? (
                  <>
                    <Button
                      size="lg"
                      variant={isFastForward ? "default" : "ghost"}
                      onClick={() => setIsFastForward(!isFastForward)}
                      className={`w-14 h-14 rounded-full transition-all ${
                        isFastForward
                          ? "bg-orange-500 text-white shadow-orange-200 shadow-lg animate-pulse"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <Wind size={28} weight={isFastForward ? "fill" : "regular"} />
                    </Button>

                    <Button
                      size="lg"
                      variant={isActive ? "outline" : "default"}
                      onClick={() => setIsActive(!isActive)}
                      className={`w-20 h-20 rounded-full shadow-lg transition-all ${
                        isActive
                          ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                          : "bg-sky-600 text-white hover:bg-sky-700 scale-110"
                      }`}
                    >
                      {isActive ? (
                        <Pause size={32} weight="fill" />
                      ) : (
                        <Play size={32} weight="fill" />
                      )}
                    </Button>

                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={resetTimer}
                      className="w-14 h-14 rounded-full text-slate-400 hover:text-slate-600"
                    >
                      <ArrowClockwise size={28} />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="lg"
                    onClick={isBreak ? startWork : startBreak}
                    className="w-64 bg-slate-800 text-white rounded-2xl h-16 text-xl font-semibold shadow-xl hover:bg-slate-900 transition-all pointer-events-auto"
                  >
                    {isBreak ? t("startWork") : t("startBreak")}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 right-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 z-40 w-64 flex flex-col gap-4"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase">
                  {t("focusTime")}
                </label>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    {[20, 25, 45].map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setWorkTime(m * 60);
                          if (!isBreak) setTimeLeft(m * 60);
                        }}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          workTime === m * 60
                            ? "bg-slate-800 text-white"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase">
                  {t("breakTime")}
                </label>

                <div className="flex gap-2">
                  {[5, 10, 15].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setBreakTime(m * 60);
                        if (isBreak) setTimeLeft(m * 60);
                      }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        breakTime === m * 60
                          ? "bg-sky-500 text-white"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md flex flex-col items-center justify-center h-full pointer-events-none mt-[-80px]">
        <div className="relative w-full flex flex-col items-center h-80 justify-center">
          <div className="relative w-full h-[460px] flex flex-col items-center justify-center">
            <div className="relative w-[270px] h-[340px]">
              {/* HairDryer (z-40) */}
              <AnimatePresence>
                {isFastForward && isActive && <HairDryer />}
              </AnimatePresence>

              {/* Glass Back (z-0) */}
              <svg
                viewBox="0 0 200 260"
                className="absolute inset-0 w-full h-full"
              >
                <defs>
                  <linearGradient
                    id="glassFill"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#DDF5FF" stopOpacity="0.34" />
                    <stop offset="18%" stopColor="#FFFFFF" stopOpacity="0.22" />
                    <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.11" />
                    <stop offset="82%" stopColor="#FFFFFF" stopOpacity="0.24" />
                    <stop
                      offset="100%"
                      stopColor="#AEE7FF"
                      stopOpacity="0.32"
                    />
                  </linearGradient>

                  <linearGradient
                    id="waterFill"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#BEEBFF" stopOpacity="0.65" />
                    <stop
                      offset="100%"
                      stopColor="#72CFF5"
                      stopOpacity="0.35"
                    />
                  </linearGradient>

                  <filter
                    id="glassShadow"
                    x="-30%"
                    y="-30%"
                    width="160%"
                    height="160%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="8"
                      stdDeviation="8"
                      floodColor="#91DDF7"
                      floodOpacity="0.2"
                    />
                  </filter>

                  <clipPath id="glassInnerClip">
                    <path d="M42 34 L158 34 L150 224 Q148 240 132 240 L68 240 Q52 240 50 224 Z" />
                  </clipPath>

                  <linearGradient id="bgMask" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#EEF6FD" />
                    <stop offset="50%" stopColor="#F8FCFF" />
                    <stop offset="100%" stopColor="#EEF6FD" />
                  </linearGradient>
                </defs>

                <ellipse
                  cx="100"
                  cy="244"
                  rx="58"
                  ry="11"
                  fill="#9EDFFF"
                  opacity="0.22"
                />
              </svg>

              {/* Water Back Layer (z-5) */}
              <svg
                viewBox="0 0 200 260"
                className="absolute inset-0 w-full h-full z-5 pointer-events-none"
              >
                <g clipPath="url(#glassInnerClip)">
                  <motion.rect
                    x="28"
                    animate={{
                      y: waterTopY,
                      height: waterHeight,
                    }}
                    initial={false}
                    width="144"
                    fill="url(#waterFill)"
                    opacity="0.4"
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                </g>
              </svg>

              {/* Ice Cubes Layer (z-10) */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="relative w-full h-full scale-[0.88] translate-y-10">
                  <IceCube
                    index={1}
                    progress={progress}
                    baseX={-54}
                    baseY={68}
                    rotation={-10}
                    startAt={0.42}
                    endAt={0.82}
                    waterLevel={progress}
                  />

                  <IceCube
                    index={2}
                    progress={progress}
                    baseX={52}
                    baseY={70}
                    rotation={12}
                    startAt={0.5}
                    endAt={0.9}
                    waterLevel={progress}
                  />

                  <IceCube
                    index={3}
                    progress={progress}
                    baseX={0}
                    baseY={84}
                    rotation={3}
                    startAt={0.62}
                    endAt={1.0}
                    waterLevel={progress}
                  />

                  <IceCube
                    index={4}
                    progress={progress}
                    baseX={-34}
                    baseY={14}
                    rotation={7}
                    startAt={0.2}
                    endAt={0.68}
                    waterLevel={progress}
                  />

                  <IceCube
                    index={5}
                    progress={progress}
                    baseX={38}
                    baseY={18}
                    rotation={-9}
                    startAt={0.28}
                    endAt={0.74}
                    waterLevel={progress}
                  />

                  <IceCube
                    index={0}
                    progress={progress}
                    baseX={0}
                    baseY={-28}
                    rotation={4}
                    startAt={0}
                    endAt={0.56}
                    waterLevel={progress}
                  />
                </div>
              </div>

              {/* Water Front Layer (z-20) */}
              <svg
                viewBox="0 0 200 260"
                className="absolute inset-0 w-full h-full z-20 pointer-events-none"
              >
                <g clipPath="url(#glassInnerClip)">
                  <motion.rect
                    x="28"
                    animate={{
                      y: waterTopY,
                      height: waterHeight,
                    }}
                    initial={false}
                    width="144"
                    fill="url(#waterFill)"
                    opacity="0.45"
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />

                  <motion.ellipse
                    animate={{
                      cy: waterTopY,
                    }}
                    initial={false}
                    cx="100"
                    rx="72"
                    ry="7"
                    fill="#D3F3FF"
                    opacity="0.9"
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />

                  <motion.path
                    animate={{
                      d: `M28 ${waterTopY} C58 ${waterTopY - 4}, 76 ${
                        waterTopY + 4
                      }, 100 ${waterTopY} C126 ${waterTopY - 4}, 142 ${
                        waterTopY + 4
                      }, 172 ${waterTopY} L172 260 L28 260 Z`,
                    }}
                    initial={false}
                    fill="#A8E8FF"
                    opacity="0.18"
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                </g>
              </svg>

              {/* Glass Front (z-30) */}
              <svg
                viewBox="0 0 200 260"
                className="absolute inset-0 w-full h-full z-30 pointer-events-none"
              >
                <path
                  d="M36 28 L164 28 L155 225 Q153 244 135 244 L65 244 Q47 244 45 225 Z"
                  fill="url(#glassFill)"
                  stroke="#BFEFFF"
                  strokeWidth="2.4"
                  strokeOpacity="0.72"
                  filter="url(#glassShadow)"
                />

                <ellipse
                  cx="100"
                  cy="28"
                  rx="64"
                  ry="9"
                  fill="url(#bgMask)"
                  stroke="#C9F2FF"
                  strokeWidth="3"
                  strokeOpacity="0.72"
                />

                <ellipse
                  cx="100"
                  cy="29"
                  rx="56"
                  ry="6"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.2"
                  strokeOpacity="0.22"
                />

                <path
                  d="M56 44 Q49 120 61 220"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeOpacity="0.36"
                  strokeLinecap="round"
                />

                <path
                  d="M145 45 Q149 120 140 220"
                  fill="none"
                  stroke="#D8F6FF"
                  strokeWidth="2.4"
                  strokeOpacity="0.28"
                  strokeLinecap="round"
                />

                <path
                  d="M44 220 Q100 246 156 220"
                  fill="none"
                  stroke="#C7F1FF"
                  strokeWidth="2.2"
                  strokeOpacity="0.38"
                  strokeLinecap="round"
                />

                <ellipse
                  cx="100"
                  cy="238"
                  rx="46"
                  ry="7"
                  fill="#D3F3FF"
                  opacity="0.24"
                />
              </svg>

              <AnimatePresence>
                {isActive &&
                  drops.map((drop) => (
                    <motion.div
                      key={drop.id}
                      initial={{
                        y: -120,
                        x: drop.x,
                        opacity: 0,
                        scale: 0.4,
                      }}
                      animate={{
                        y: 65,
                        opacity: [0, 0.55, 0],
                        scale: [0.4, 0.8, 0.8],
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, ease: "easeIn" }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 w-2 h-3 bg-blue-100/50 rounded-full z-20"
                    />
                  ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
