"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import { MINI_APPS, MiniApp } from "@/lib/apps";
import { updateAppOrderAction, setOnboardingFinishedAction } from "../home/actions";
import { useNotifications } from "@/hooks/use-notifications";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  choices?: Array<{ label: string; value: string; description?: string }>;  
  showApps?: boolean;
  stepId?: string;
}

const ONBOARDING_STEPS = [
  {
    id: "social",
    title: "Sosyal & Etkinlik",
    question: "Sosyal hayatını canlandıracak araçları ana ekranına eklemek ister misin? 🤝",
    appIds: ["suggest", "kim-gelir"]
  },
  {
    id: "city",
    title: "Şehrini Keşfet",
    question: "Şehrindeki en iyi mekanları ve etkinlikleri keşfetmek için bu araçları ekleyelim mi? 🗺️",
    appIds: ["one-day-city-guide", "workplaces", "digital-menu", "stamp-card", "concert-list"]
  },
  {
    id: "finance",
    title: "Finans & Tasarruf",
    question: "Finansal takibini kolaylaştıracak araçları ister misin? 💰",
    appIds: ["budget", "tasarruf-challenges", "subcenter"]
  },
  {
    id: "entertainment",
    title: "Eğlence & Hobi",
    question: "Boş zamanların için eğlence ve hobi araçlarını ekleyelim mi? 🎮",
    appIds: ["iskambil", "memedex", "series-track", "hobby-center", "chocolate-db"]
  },
  {
    id: "campus",
    title: "Kampüslülere Özel",
    question: "Kampüs hayatını kolaylaştıracak bu araçları ana ekranına eklemek ister misin? 🎓",
    appIds: ["itu-yemekhane", "campus-events", "campus-concerts"]
  }
];

export default function OnboardingPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [showGoHomeButton, setShowGoHomeButton] = useState(false);
  const { permission, handleRequestPermission, loading: notificationLoading, isNativePushSupported } = useNotifications();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Implemented mini-apps
  const availableApps = MINI_APPS.filter((app) => app.isImplemented && !app.isCancelled);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, showGoHomeButton]);

  const promptNotificationsOrGoHome = () => {
    const shouldAskNotifications = isNativePushSupported && permission === "default";

    if (shouldAskNotifications) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-notifications-${Date.now()}`,
            role: "assistant",
            content:
              "Son bir şey! Seçtiğin araçların arkadaşlarınla, etkinliklerle ve hatırlatıcılarla düzgün çalışması için bildirimleri açmanı öneririz. 🔔",
            choices: [
              { label: "Bildirimleri Aç", value: "enable-notifications" },
              { label: "Şimdilik Geç", value: "skip-notifications" },
            ],
          },
        ]);
      }, 800);
    } else {
      setShowGoHomeButton(true);
    }
  };

  // Initial greeting
  useEffect(() => {
    setMessages([
      {
        id: "msg-1",
        role: "assistant",
        content: "Selam! Everything'de hayatı kolaylaştıran 30'dan fazla mini araç var. 🌟",
      },
      {
        id: "msg-disclaimer",
        role: "assistant",
        content: "Everything, tarafımızca geliştirilen ve yönetilen yerleşik araçlardan oluşan bir koleksiyondur. Üçüncü taraf uygulamaları listelemez, satmaz veya bunlara bağlantı vermez. 🛡️",
      },
      {
        id: "msg-2",
        role: "assistant",
        content: "Sana en uygun olanları seçip ana ekranını (hub) birlikte hazırlayalım mı?",
        choices: [
          { 
            label: "Hadi Başlayalım! 🚀", 
            value: "start"
          },
          { 
            label: "Tümünü Ekle ve Geç ⏩", 
            value: "skip"
          },
        ],
      },
    ]);
  }, []);

  const handleSkipAll = async () => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-skip-complete-${Date.now()}`,
        role: "assistant",
        content: "Harika! Tüm araçları ana ekranına ekledim. Keyifli kullanımlar! ✨",
      },
    ]);

    setIsSaving(true);
    const allIds = availableApps.map((a) => a.id);
    const userId = user?.id;

    localStorage.setItem(`app_order_${userId || "guest"}`, JSON.stringify(allIds));
    localStorage.setItem(`onboarding_completed_${userId || "guest"}`, "true");

    if (userId) {
      await updateAppOrderAction(userId, allIds);
      await setOnboardingFinishedAction(userId, true);
    }
    
    setIsSaving(false);
    setIsOnboardingComplete(true);
    promptNotificationsOrGoHome();
  };

  const handleNextStep = (index: number) => {
    if (index >= ONBOARDING_STEPS.length) {
      void handleSaveWorkspace();
      return;
    }

    const step = ONBOARDING_STEPS[index];
    const stepApps = availableApps.filter(app => step.appIds.includes(app.id));
    const appNames = stepApps.map(app => app.name).join(", ");
    
    setCurrentStepIndex(index);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-step-${step.id}`,
          role: "assistant",
          content: step.question,
          stepId: step.id,
          showApps: true,
          choices: [
            { 
              label: "Ekle ve Devam Et ✅", 
              value: `add-all-${index}`
            },
            { 
              label: "Kategoriyi Atla ⏭️", 
              value: `skip-step-${index}`
            },
          ],
        },
      ]);
    }, 800);
  };

  const handleChoiceSelect = (choice: { label: string; value: string }) => {
    // Add user message
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev.map((m) => ({ ...m, choices: undefined })), // remove previous choices
      { id: userMsgId, role: "user", content: choice.label },
    ]);

    if (choice.value === "skip") {
      void handleSkipAll();
      return;
    }

    if (choice.value === "start") {
      handleNextStep(0);
      return;
    }

    if (choice.value.startsWith("add-all-")) {
      const index = parseInt(choice.value.split("-").pop() || "0");
      const step = ONBOARDING_STEPS[index];
      setSelectedAppIds((prev) => {
        const next = new Set(prev);
        step.appIds.forEach(id => next.add(id));
        return next;
      });
      handleNextStep(index + 1);
      return;
    }

    if (choice.value.startsWith("skip-step-")) {
      const index = parseInt(choice.value.split("-").pop() || "0");
      handleNextStep(index + 1);
      return;
    }

    if (choice.value === "enable-notifications") {
      void (async () => {
        await handleRequestPermission();
        setShowGoHomeButton(true);
      })();
      return;
    }

    if (choice.value === "skip-notifications") {
      setShowGoHomeButton(true);
      return;
    }
  };

  const handleSaveWorkspace = async () => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-complete-${Date.now()}`,
        role: "assistant",
        content: "Harika! Seçtiğin araçlarla ana ekranını hazırladım. Diğer tüm araçları 'Keşfet' sekmesinden bulabilirsin. Sürekli yeni modüller ekliyoruz, arada kontrol etmeyi unutma! Keyifli kullanımlar! ✨",
      },
    ]);

    setIsSaving(true);
    const selectedIds = Array.from(selectedAppIds);
    const finalIds = selectedIds.length > 0 ? selectedIds : availableApps.map((a) => a.id);
    const userId = user?.id;

    localStorage.setItem(`app_order_${userId || "guest"}`, JSON.stringify(finalIds));
    localStorage.setItem(`onboarding_completed_${userId || "guest"}`, "true");

    if (userId) {
      await updateAppOrderAction(userId, finalIds);
      await setOnboardingFinishedAction(userId, true);
    }

    setIsSaving(false);
    setIsOnboardingComplete(true);
    promptNotificationsOrGoHome();
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
          {!isOnboardingComplete && (
            <button
              onClick={handleSkipAll}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Atla
            </button>
          )}
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
                    {message.showApps && message.stepId && (
                      <div className="flex flex-col gap-3 mt-1 w-full bg-white border border-white/60 p-4 rounded-2xl shadow-sm">
                        <div className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">
                          {ONBOARDING_STEPS.find(s => s.id === message.stepId)?.title}
                        </div>
                        <div className="flex flex-col gap-2">
                          {availableApps
                            .filter(app => ONBOARDING_STEPS.find(s => s.id === message.stepId)?.appIds.includes(app.id))
                            .map((app) => {
                              const AppIcon = app.icon;
                              return (
                                <div
                                  key={app.id}
                                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/30 text-left"
                                >
                                  <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                                    style={{ backgroundColor: app.color }}
                                  >
                                    <AppIcon size={20} weight="fill" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-black text-gray-900">
                                      {app.name}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-0.5 font-medium leading-normal">
                                      {app.description}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
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
                    disabled={notificationLoading}
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
