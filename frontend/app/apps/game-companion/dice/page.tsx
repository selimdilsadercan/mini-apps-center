"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import AppBar from "../components/AppBar";
import Header from "../components/Header";
import Dice from "../components/Dice";

// Local mock hooks
const useAuthMock = () => ({
  isSignedIn: true,
  isLoaded: true,
});

export default function DicePage() {
  const { isSignedIn, isLoaded } = useAuthMock();
  const router = useRouter();
  const [rollHistory, setRollHistory] = useState<number[]>([]);

  // Redirect to home page if user is not signed in
  if (!isLoaded || (isLoaded && !isSignedIn)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const handleRoll = (value: number) => {
    setRollHistory((prev) => [value, ...prev].slice(0, 10)); // Son 10 atışı sakla
  };

  const clearHistory = () => {
    setRollHistory([]);
  };

  return (
    <div
      className="min-h-screen pb-20 lg:pb-0"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Header for mobile screens */}
      <div className="lg:hidden">
        <Header />
      </div>

      {/* Sidebar for wide screens */}
      <Sidebar currentPage={null} />

      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Main Content */}
        <div className="px-4 py-6 pt-20 lg:pt-6">
          <div className="max-w-2xl mx-auto">
            {/* Page Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 mb-2">
                Zar Atma
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                6 yüzlü zarı atın ve sonucu görün
              </p>
            </div>

            {/* Dice Component */}
            <div className="flex justify-center mb-8">
              <Dice size="lg" onRoll={handleRoll} />
            </div>

            {/* Roll History */}
            {rollHistory.length > 0 && (
              <div className="bg-white dark:bg-[var(--card-background)] rounded-2xl p-6 border border-gray-200 dark:border-[var(--card-border)] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                    Son Atışlar
                  </h2>
                  <button
                    onClick={clearHistory}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    Temizle
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {rollHistory.map((value, index) => (
                    <div
                      key={index}
                      className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-lg font-semibold text-gray-900 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600"
                    >
                      {value}
                    </div>
                  ))}
                </div>
                {rollHistory.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[var(--card-border)]">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Toplam Atış:
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-200">
                        {rollHistory.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Ortalama:
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-200">
                        {(
                          rollHistory.reduce((a, b) => a + b, 0) /
                          rollHistory.length
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AppBar for mobile screens */}
      <div className="lg:hidden">
        <AppBar currentPage="games" />
      </div>
    </div>
  );
}
