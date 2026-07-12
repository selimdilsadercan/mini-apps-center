"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import { MINI_APPS, MiniApp } from "@/lib/apps";
import { updateAppOrderAction, setOnboardingFinishedAction } from "../home/actions";
import { useQueryClient } from "@tanstack/react-query";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  choices?: Array<{ label: string; value: string; description?: string }>;  
  showApps?: boolean;
  stepId?: string;
}

const CATEGORY_ORDER = [
  "Sosyal & Etkinlik",
  "Şehrini Keşfet",
  "Pratik Araçlar",
  "Finans & Tasarruf",
  "Eğlence & Hobi",
  "Kampüslülere Özel"
];

export default function OnboardingPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showGoHomeButton, setShowGoHomeButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Implemented mini-apps
  const availableApps = MINI_APPS.filter((app) => app.isImplemented && !app.isCancelled);

  const groupedApps = useMemo(() => {
    const grouped: Record<string, MiniApp[]> = {};
    availableApps.forEach(app => {
      if (!grouped[app.category]) grouped[app.category] = [];
      grouped[app.category].push(app);
    });
    return grouped;
  }, [availableApps]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, showGoHomeButton]);

  // Initial greeting
  useEffect(() => {
    setMessages([
      {
        id: "msg-1",
        role: "assistant",
        content: "Selam! Everything'e hoş geldin. 🌟",
      },
      {
        id: "msg-disclaimer",
        role: "assistant",
        content: "Everything, hayatını kolaylaştıracak 30'dan fazla mini aracın bir arada olduğu bir platformdur. 🛡️",
      },
      {
        id: "msg-apps",
        role: "assistant",
        content: "Bünyemizde şu an senin için hazırladığımız araçlar şunlar:",
        showApps: true,
        choices: [
          { 
            label: "Anladım, Başlayalım! 🚀", 
            value: "start"
          }
        ],
      },
    ]);
  }, []);

  const handleStart = async () => {
    setIsSaving(true);
    const allIds = availableApps.map((a) => a.id);
    const userId = user?.id;

    localStorage.setItem(`app_order_${userId || "guest"}`, JSON.stringify(allIds));
    localStorage.setItem(`onboarding_completed_${userId || "guest"}`, "true");

    if (userId) {
      // Set localStorage FIRST before any async actions
      localStorage.setItem(`onboarding_completed_${userId}`, "true");
      
      await updateAppOrderAction(userId, allIds);
      await setOnboardingFinishedAction(userId, true);
      
      // Instantly update the cache to prevent redirect loop
      queryClient.setQueryData(["user", "preferences", userId], (prev: any) => ({
        ...prev,
        isOnboardingFinished: true,
        appOrder: allIds
      }));

      // Also invalidate to be sure
      await queryClient.invalidateQueries({ queryKey: ["user", "preferences", userId] });
    }
    
    setIsSaving(false);
    setShowGoHomeButton(true);
  };

  const handleChoiceSelect = (choice: { label: string; value: string }) => {
    // Add user message
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev.map((m) => ({ ...m, choices: undefined })), // remove previous choices
      { id: userMsgId, role: "user", content: choice.label },
    ]);

    if (choice.value === "start") {
      void handleStart();
      return;
    }
  };

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#FAF9F7] selection:bg-indigo-100 antialiased">
      {/* Dynamic Background Blurs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-purple-100/20 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-30 shrink-0 bg-[#FAF9F7]/80 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto w-full max-w-lg px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-gray-900 tracking-tight">Everything</span>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto w-full min-h-0">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-6 pb-24">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex max-w-[85%] ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm leading-relaxed text-sm font-medium ${
                        message.role === "user"
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-white border border-white/60 text-gray-800 rounded-tl-none"
                      }`}
                    >
                      {message.content}
                    </div>

                    {/* Interactive App List for the step */}
                    {message.showApps && (
                      <div className="flex flex-col gap-6 mt-1 w-full bg-white border border-white/60 p-5 rounded-2xl shadow-sm">
                        {CATEGORY_ORDER.map(category => {
                          const apps = groupedApps[category];
                          if (!apps || apps.length === 0) return null;
                          
                          return (
                            <div key={category} className="flex flex-col gap-3">
                              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">
                                {category}
                              </div>
                              <div className="flex flex-col gap-2">
                                {apps.map((app) => {
                                  const AppIcon = app.icon;
                                  return (
                                    <div
                                      key={app.id}
                                      className="flex items-center gap-3 p-3 rounded-2xl border border-gray-50 bg-gray-50/30"
                                    >
                                      <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                                        style={{ backgroundColor: app.color }}
                                      >
                                        <AppIcon size={20} weight="fill" />
                                      </div>
                                      <div className="flex-1 min-w-0 text-left">
                                        <div className="text-xs font-black text-gray-900 truncate">
                                          {app.name}
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-0.5 font-medium line-clamp-1 leading-tight">
                                          {app.description}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Choices buttons (Moved outside the message loop to align right) */}
            {messages.length > 0 && messages[messages.length - 1].choices && !showGoHomeButton && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col items-end gap-2 mt-[-12px] mb-4"
              >
                {messages[messages.length - 1].choices?.map((choice) => (
                  <button
                    key={choice.value}
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleChoiceSelect(choice)}
                    className="w-full max-w-[280px] bg-white hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 text-left px-4 py-3 rounded-2xl font-bold text-sm text-gray-800 shadow-sm transition-all active:scale-[0.98] flex flex-col gap-1 group disabled:opacity-60 disabled:pointer-events-none"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{choice.label}</span>
                      <ArrowRight size={16} className="text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    {choice.description && (
                      <span className="text-[11px] font-medium text-gray-500 leading-normal">
                        {choice.description}
                      </span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}

            {showGoHomeButton && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-end gap-2 mt-2 mb-4"
              >
                <button
                  type="button"
                  onClick={() => router.replace("/home")}
                  className="w-full max-w-[280px] bg-indigo-600 hover:bg-indigo-700 text-white text-center px-4 py-4 rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                >
                  <span>Ana Sayfaya Git</span>
                  <ArrowRight size={18} weight="bold" className="group-hover:translate-x-0.5 transition-all" />
                </button>
              </motion.div>
            )}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="flex max-w-[85%]">
                  <div className="px-4 py-3 rounded-2xl bg-white border border-white/60 shadow-sm rounded-tl-none">
                    <div className="flex gap-1.5 items-center h-4">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </main>
    </div>
  );
}
