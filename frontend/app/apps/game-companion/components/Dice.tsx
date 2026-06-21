"use client";

import { useState, useEffect } from "react";

interface DiceProps {
  size?: "sm" | "md" | "lg";
  onRoll?: (value: number) => void;
}

export default function Dice({ size = "md", onRoll }: DiceProps) {
  const [value, setValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);

  const sizeClasses = {
    sm: "w-16 h-16 text-2xl",
    md: "w-24 h-24 text-4xl",
    lg: "w-32 h-32 text-6xl",
  };

  const rollDice = () => {
    if (isRolling) return;

    setIsRolling(true);

    // Animasyon için rastgele değerler göster
    const rollAnimation = () => {
      const randomValue = Math.floor(Math.random() * 6) + 1;
      setValue(randomValue);
    };

    // 10 kez rastgele değer göster (animasyon efekti)
    let rollCount = 0;
    const interval = setInterval(() => {
      rollAnimation();
      rollCount++;
      if (rollCount >= 10) {
        clearInterval(interval);
        // Son değeri belirle
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setValue(finalValue);
        setIsRolling(false);
        if (onRoll) {
          onRoll(finalValue);
        }
      }
    }, 100);
  };

  // Klavye ile zar atma (Space veya Enter)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.code === "Space" || e.code === "Enter") && !isRolling) {
        e.preventDefault();
        rollDice();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isRolling]);

  // Zar yüzü noktaları
  const renderDots = () => {
    const dots = [];
    const positions: { [key: number]: number[][] } = {
      1: [[0.5, 0.5]],
      2: [
        [0.25, 0.25],
        [0.75, 0.75],
      ],
      3: [
        [0.25, 0.25],
        [0.5, 0.5],
        [0.75, 0.75],
      ],
      4: [
        [0.25, 0.25],
        [0.75, 0.25],
        [0.25, 0.75],
        [0.75, 0.75],
      ],
      5: [
        [0.25, 0.25],
        [0.75, 0.25],
        [0.5, 0.5],
        [0.25, 0.75],
        [0.75, 0.75],
      ],
      6: [
        [0.25, 0.25],
        [0.75, 0.25],
        [0.25, 0.5],
        [0.75, 0.5],
        [0.25, 0.75],
        [0.75, 0.75],
      ],
    };

    const dotPositions = positions[value] || [];
    const dotSize =
      size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4";

    return dotPositions.map((pos, index) => (
      <div
        key={index}
        className={`absolute bg-gray-900 dark:bg-gray-100 rounded-full ${dotSize}`}
        style={{
          left: `${pos[0] * 100}%`,
          top: `${pos[1] * 100}%`,
          transform: "translate(-50%, -50%)",
        }}
      />
    ));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={rollDice}
        disabled={isRolling}
        className={`
          relative bg-white dark:bg-[var(--card-background)] 
          border-2 border-gray-300 dark:border-gray-600 
          rounded-lg shadow-lg
          ${sizeClasses[size]}
          flex items-center justify-center
          transition-all duration-200
          ${isRolling ? "animate-spin" : "hover:scale-105 hover:shadow-xl"}
          disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-95
        `}
        style={{
          transform: isRolling ? "rotate(360deg)" : undefined,
        }}
      >
        {renderDots()}
      </button>

      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isRolling ? "Zar atılıyor..." : `Zar: ${value}`}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Zar atmak için tıklayın veya Space/Enter tuşuna basın
        </p>
      </div>
    </div>
  );
}
