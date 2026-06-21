"use client";

import { useState } from "react";
import {
  Crown,
  Spade,
  Heart,
  Club,
  Diamond,
  ArrowRight,
  Star,
} from "@phosphor-icons/react";

interface PokerHand {
  name: string;
  description: string;
  example: string[];
  icon: React.ReactNode;
  rank: number;
}

export default function PokerAssistantTab() {
  const [selectedHand, setSelectedHand] = useState<number | null>(null);

  const pokerHands: PokerHand[] = [
    {
      name: "Royal Flush",
      description: "A, K, Q, J, 10, aynı renkten",
      example: ["A♠", "K♠", "Q♠", "J♠", "10♠"],
      icon: <Crown size={20} className="text-yellow-600" />,
      rank: 1,
    },
    {
      name: "Straight Flush",
      description: "Sıralı beş kart, aynı renkten",
      example: ["8♠", "7♠", "6♠", "5♠", "4♠"],
      icon: <ArrowRight size={20} className="text-blue-600" />,
      rank: 2,
    },
    {
      name: "Four of a Kind",
      description: "Aynı değerden dört kart",
      example: ["9♠", "9♥", "9♣", "9♦", "K♠"],
      icon: <div className="text-2xl font-bold text-purple-600">4</div>,
      rank: 3,
    },
    {
      name: "Full House",
      description: "Üçlü ve çift",
      example: ["A♠", "A♥", "A♣", "K♦", "K♠"],
      icon: <div className="text-lg">🏠</div>,
      rank: 4,
    },
    {
      name: "Flush",
      description: "Aynı renkten beş kart, sıralı değil",
      example: ["K♠", "10♠", "7♠", "4♠", "2♠"],
      icon: <div className="text-lg">🦅</div>,
      rank: 5,
    },
    {
      name: "Straight",
      description: "Sıralı beş kart, farklı renklerden",
      example: ["9♠", "8♥", "7♣", "6♦", "5♠"],
      icon: <ArrowRight size={20} className="text-green-600" />,
      rank: 6,
    },
    {
      name: "Three of a Kind",
      description: "Aynı değerden üç kart",
      example: ["Q♠", "Q♥", "Q♣", "7♦", "4♠"],
      icon: <div className="text-2xl font-bold text-orange-600">3</div>,
      rank: 7,
    },
    {
      name: "Two Pair",
      description: "İki farklı çift",
      example: ["J♠", "J♥", "4♣", "4♦", "9♠"],
      icon: <div className="text-lg">⭕⭕</div>,
      rank: 8,
    },
    {
      name: "One Pair",
      description: "Aynı değerden iki kart",
      example: ["10♠", "10♥", "K♣", "4♦", "2♠"],
      icon: <div className="text-lg">⭕</div>,
      rank: 9,
    },
  ];

  const getSuitColor = (suit: string) => {
    if (suit === "♥" || suit === "♦") return "text-red-600";
    return "text-black";
  };

  const getSuitIcon = (suit: string) => {
    switch (suit) {
      case "♠":
        return <Spade size={16} weight="fill" className="text-black" />;
      case "♥":
        return <Heart size={16} weight="fill" className="text-red-600" />;
      case "♣":
        return <Club size={16} weight="fill" className="text-black" />;
      case "♦":
        return <Diamond size={16} weight="fill" className="text-red-600" />;
      default:
        return suit;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-2">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <Spade size={20} className="text-black" />
            <Heart size={20} className="text-red-600" />
            <h1 className="text-xl font-bold text-gray-800">POKER</h1>
            <Club size={20} className="text-black" />
            <Diamond size={20} className="text-red-600" />
          </div>
          <h2 className="text-sm font-semibold text-gray-600">HAND RANKINGS</h2>
        </div>

        {/* Poker Hands List */}
        <div className="space-y-1">
          {pokerHands.map((hand, index) => (
            <div
              key={hand.rank}
              className={`bg-white dark:bg-[var(--card-background)] rounded-lg border border-gray-100 dark:border-[var(--card-border)] hover:shadow-sm transition-all duration-200 cursor-pointer ${
                selectedHand === hand.rank
                  ? "ring-1 ring-blue-500 dark:ring-blue-400 shadow-sm"
                  : ""
              }`}
              onClick={() =>
                setSelectedHand(selectedHand === hand.rank ? null : hand.rank)
              }
            >
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 font-bold text-xs">
                        {hand.rank}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {hand.name}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    {hand.example.map((card, cardIndex) => (
                      <div
                        key={cardIndex}
                        className="w-8 h-10 bg-white dark:bg-[var(--card-background)] border border-gray-200 dark:border-[var(--card-border)] rounded flex flex-col items-center justify-center text-sm font-bold shadow-sm"
                      >
                        <span className={getSuitColor(card.slice(-1))}>
                          {card.slice(0, -1)}
                        </span>
                        <div className="mt-0.5">
                          {getSuitIcon(card.slice(-1))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedHand === hand.rank && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-[var(--card-background)] rounded border border-blue-200 dark:border-[var(--card-border)]">
                    <p className="text-gray-600 dark:text-gray-300 text-xs">
                      {hand.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
