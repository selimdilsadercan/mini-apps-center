"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkle,
  PaperPlaneRight,
  ClockCounterClockwise,
  User,
  X,
  Plus,
  ChatCircle,
  Trash,
} from "@phosphor-icons/react";
import AppBar, { ActivePage } from "@/components/AppBar";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type ChatMessage,
  type SavedConversation,
  createConversationId,
  loadConversations,
  getActiveChatId,
  setActiveChatId,
  upsertConversation,
  deserializeMessages,
  getConversationById,
  hasUserMessages,
  deleteConversation,
} from "@/lib/ai-chat-storage";
import { sendAssistantChat } from "@/lib/assistant-chat";
import { useAdminRouteGuard } from "@/hooks/useAdminRouteGuard";
import AssistantCardGallery from "@/components/ai-chat/AssistantCardGallery";
import ChatMessageContent from "@/components/ai-chat/ChatMessageContent";
import toast from "react-hot-toast";

export default function AIChatPage() {
  const { isAdmin, loading: adminLoading } = useAdminRouteGuard();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef(messages);
  const chatIdRef = useRef(chatId);

  messagesRef.current = messages;
  chatIdRef.current = chatId;

  const userId = user?.id ?? null;

  const persistChat = useCallback(
    async (id: string, msgs: ChatMessage[]) => {
      const next = await upsertConversation(id, msgs, userId);
      setConversations(next);
    },
    [userId],
  );

  useEffect(() => {
    if (!isUserLoaded) return;

    let cancelled = false;

    async function init() {
      const list = await loadConversations(userId);
      if (cancelled) return;

      setConversations(list);

      const activeId = getActiveChatId();
      const existing =
        activeId && list.find((c) => c.id === activeId)
          ? list.find((c) => c.id === activeId)
          : activeId
            ? await getConversationById(activeId, userId)
            : undefined;

      if (cancelled) return;

      if (existing) {
        setChatId(existing.id);
        setMessages(deserializeMessages(existing.messages));
      } else {
        const newId = createConversationId();
        setChatId(newId);
        setActiveChatId(newId);
        setMessages([]);
      }

      setIsHydrated(true);
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [isUserLoaded, userId]);

  useEffect(() => {
    if (!isHydrated || !chatId || !hasUserMessages(messages)) return;
    void persistChat(chatId, messages);
  }, [messages, chatId, isHydrated, persistChat]);

  useEffect(() => {
    return () => {
      const id = chatIdRef.current;
      const msgs = messagesRef.current;
      if (id && hasUserMessages(msgs)) {
        void upsertConversation(id, msgs, userId);
      }
    };
  }, [userId]);

  useEffect(() => {
    const handleInsert = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === "string") {
        setInput(detail);
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 50);
      }
    };
    window.addEventListener("insert-chat-input", handleInsert);
    return () => {
      window.removeEventListener("insert-chat-input", handleInsert);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (hasUserMessages(messages)) {
      scrollToBottom();
    }
  }, [messages]);

  const isEmptyChat = !hasUserMessages(messages);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, isEmptyChat, resizeTextarea]);

  const startNewChat = () => {
    const newId = createConversationId();
    setChatId(newId);
    setActiveChatId(newId);
    setMessages([]);
    setHistoryOpen(false);
  };

  const openConversation = (conversation: SavedConversation) => {
    setChatId(conversation.id);
    setActiveChatId(conversation.id);
    setMessages(deserializeMessages(conversation.messages));
    setHistoryOpen(false);
  };

  const handleDeleteConversation = async (
    e: React.MouseEvent,
    conversationId: string,
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const wasActive = chatId === conversationId;
    if (wasActive) {
      const newId = createConversationId();
      setChatId(newId);
      setActiveChatId(newId);
      setMessages([]);
    }

    if (!userId) {
      const next = await deleteConversation(conversationId, null);
      setConversations(next);
      return;
    }

    try {
      const next = await deleteConversation(conversationId, userId);
      setConversations(next);
    } catch (error) {
      console.error("deleteConversation failed:", error);
      toast.error("Sohbet veritabanından silinemedi.");
      const restored = await loadConversations(userId);
      setConversations(restored);
      if (wasActive) {
        const deleted = restored.find((c) => c.id === conversationId);
        if (deleted) {
          setChatId(deleted.id);
          setActiveChatId(deleted.id);
          setMessages(deserializeMessages(deleted.messages));
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chatId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const history = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const reply = await sendAssistantChat({
        userId,
        messages: history,
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply.content,
        cards: reply.cards,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Yanıt alınamadı. Backend çalışıyor mu kontrol et.";
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Bir sorun oluştu: ${message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatListDate = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
    });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const renderChatInput = (variant: "empty" | "compact") => (
    <form
      onSubmit={handleSubmit}
      className={`flex w-full items-end gap-2 border border-white/60 bg-white/90 backdrop-blur-2xl transition-shadow duration-300 ${
        variant === "empty"
          ? "rounded-[2rem] p-3 shadow-[0_16px_48px_rgba(0,0,0,0.1)]"
          : "rounded-[2rem] p-2 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
      }`}
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onInput={resizeTextarea}
        onKeyDown={handleInputKeyDown}
        rows={1}
        placeholder={
          variant === "empty" ? "Herhangi bir şey sor..." : "Bir şeyler sor..."
        }
        className={`max-h-40 flex-1 resize-none overflow-y-auto bg-transparent px-4 font-medium text-gray-900 focus:outline-none placeholder:text-gray-400 ${
          variant === "empty"
            ? "min-h-[3.25rem] py-3.5 text-base leading-relaxed"
            : "min-h-[2.5rem] py-2.5 text-sm leading-relaxed"
        }`}
      />
      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className={`flex flex-shrink-0 items-center justify-center transition-all ${
          variant === "empty"
            ? "mb-0.5 h-12 w-12 rounded-2xl"
            : "mb-0.5 h-11 w-11 rounded-[1.25rem]"
        } ${
          !input.trim() || isLoading
            ? "bg-gray-100 text-gray-400"
            : "bg-violet-600 text-white shadow-lg shadow-violet-200 active:scale-90"
        }`}
      >
        <PaperPlaneRight size={20} weight="fill" />
      </button>
    </form>
  );

  const isPageReady = isUserLoaded && isHydrated;

  if (adminLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#FAF9F7] selection:bg-violet-100">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-100/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/20 blur-[120px] rounded-full"></div>
      </div>

      <header className="relative z-30 shrink-0 bg-[#FAF9F7]">
        <div className="mx-auto w-full max-w-lg px-6 pt-5 pb-3 flex items-center justify-between">
          <h1 className="text-3xl font-[1000] text-gray-900 tracking-tight leading-none">
            AI Assistant
          </h1>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="p-2.5 rounded-2xl text-gray-500 hover:text-gray-800 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-sm active:scale-95 transition-all duration-200"
            aria-label="Sohbet geçmişi"
          >
            <ClockCounterClockwise size={22} weight="bold" />
          </button>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-4 translate-y-full bg-gradient-to-b from-[#FAF9F7] to-transparent"
          aria-hidden
        />
      </header>

      <main
        className={`relative z-10 min-h-0 w-full flex-1 ${
          !isPageReady
            ? "flex items-center justify-center"
            : isEmptyChat
              ? "flex flex-col items-center justify-center overflow-hidden px-6 pb-6"
              : "overflow-y-auto overflow-x-hidden"
        }`}
      >
        {!isPageReady ? (
          <Sparkle
            size={32}
            weight="fill"
            className="text-violet-400 animate-pulse"
          />
        ) : null}
        {isPageReady && isEmptyChat && (
          <div className="flex w-full max-w-lg flex-col items-center gap-5">
            <p className="px-2 text-center text-2xl font-semibold leading-snug tracking-tight text-gray-800 sm:text-[1.65rem]">
              Hazır olduğunda buradayım.
            </p>
            {renderChatInput("empty")}
          </div>
        )}
        <div
          className={`mx-auto flex w-full max-w-lg flex-col gap-6 px-6 ${
            !isPageReady || isEmptyChat ? "hidden" : "pt-3 pb-4"
          }`}
        >
          <AnimatePresence initial={false}>
            {isPageReady &&
              !isEmptyChat &&
              messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-3 ${
                    message.role === "assistant" && message.cards?.length
                      ? "max-w-[min(100%,28rem)] w-full"
                      : "max-w-[85%]"
                  } ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                      message.role === "user"
                        ? "bg-white border border-gray-100"
                        : "bg-violet-600"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User size={16} weight="bold" className="text-gray-600" />
                    ) : (
                      <Sparkle size={16} weight="fill" color="white" />
                    )}
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm min-w-0 ${
                      message.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white border border-white/60 text-gray-800 rounded-tl-none"
                    } ${message.role === "assistant" && message.cards?.length ? "w-full max-w-full" : ""}`}
                  >
                    <ChatMessageContent
                      content={message.content}
                      className={`text-[14px] leading-relaxed font-medium ${
                        message.role === "user" ? "text-white" : "text-gray-800"
                      }`}
                    />
                    {message.role === "assistant" && message.cards?.length ? (
                      <AssistantCardGallery cards={message.cards} userId={userId} />
                    ) : null}
                    <span
                      className={`text-[10px] mt-1.5 block opacity-50 font-bold ${
                        message.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isPageReady && !isEmptyChat && isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-xl bg-violet-600 flex-shrink-0 flex items-center justify-center shadow-sm">
                  <Sparkle
                    size={16}
                    weight="fill"
                    color="white"
                    className="animate-spin-slow"
                  />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white border border-white/60 shadow-sm rounded-tl-none">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {isPageReady && !isEmptyChat && <div ref={messagesEndRef} />}
        </div>
      </main>

      {isPageReady && !isEmptyChat && (
        <footer className="relative z-40 shrink-0 w-full px-6 pb-28 pt-2">
          <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-1.5">
            {renderChatInput("compact")}
          </div>
        </footer>
      )}

      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
              aria-label="Kapat"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="chat-history-title"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed left-1/2 top-1/2 z-[70] flex w-[calc(100%-2rem)] max-w-md max-h-[min(75vh,32rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[1.75rem] bg-white/95 backdrop-blur-2xl border border-white/60 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                <h2 id="chat-history-title" className="text-lg font-black text-gray-900">
                  Sohbetler
                </h2>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                  aria-label="Kapat"
                >
                  <X size={22} weight="bold" />
                </button>
              </div>

              <button
                type="button"
                onClick={startNewChat}
                className="mx-5 mt-4 flex items-center gap-3 rounded-2xl bg-violet-600 px-4 py-3.5 text-white font-bold text-sm shadow-lg shadow-violet-200 active:scale-[0.98] transition-transform shrink-0"
              >
                <Plus size={20} weight="bold" />
                Yeni sohbet
              </button>

              <div className="flex-1 overflow-y-auto px-3 py-4 mt-2 min-h-0">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <ChatCircle
                      size={48}
                      weight="duotone"
                      className="text-gray-300 mb-3"
                    />
                    <p className="text-sm font-bold text-gray-500">
                      Henüz kayıtlı sohbet yok
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Mesaj gönderip başka sayfaya geçtiğinde sohbetler burada
                      görünür.
                    </p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {conversations.map((conversation) => {
                      const isActive = conversation.id === chatId;
                      return (
                        <li key={conversation.id}>
                          <div
                            className={`flex items-center gap-1 rounded-2xl transition-colors ${
                              isActive
                                ? "bg-violet-50 border border-violet-100"
                                : "hover:bg-gray-50 border border-transparent"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => openConversation(conversation)}
                              className="flex-1 min-w-0 text-left px-4 py-3.5"
                            >
                              <p
                                className={`text-sm font-bold truncate ${
                                  isActive ? "text-violet-700" : "text-gray-900"
                                }`}
                              >
                                {conversation.title}
                              </p>
                              <p className="text-[11px] font-medium text-gray-400 mt-1">
                                {formatListDate(conversation.updatedAt)}
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={(e) =>
                                handleDeleteConversation(e, conversation.id)
                              }
                              className="flex-shrink-0 p-2.5 mr-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              aria-label="Sohbeti sil"
                            >
                              <Trash size={18} weight="bold" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* <AppBar activePage={ActivePage.AI_CHAT} /> */}
    </div>
  );
}
