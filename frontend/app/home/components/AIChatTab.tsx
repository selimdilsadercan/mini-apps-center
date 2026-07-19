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
  Robot,
} from "@phosphor-icons/react";
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
import AssistantCardGallery from "@/components/ai-chat/AssistantCardGallery";
import ChatMessageContent from "@/components/ai-chat/ChatMessageContent";
import toast from "react-hot-toast";

interface AIChatTabProps {
  userId?: string;
}

export function AIChatTab({ userId: propUserId }: AIChatTabProps) {
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

  const userId = propUserId ?? user?.id ?? null;

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
      className={`flex w-full items-end gap-2 border border-app-border bg-app-surface backdrop-blur-2xl transition-shadow duration-300 ${
        variant === "empty"
          ? "rounded-2xl p-3 shadow-md"
          : "rounded-2xl p-2 shadow-sm"
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
          variant === "empty" ? "Asistana bir şey sor..." : "Bir şeyler yaz..."
        }
        className={`max-h-40 flex-1 resize-none overflow-y-auto bg-transparent px-3 text-app-text focus:outline-none placeholder:text-app-muted ${
          variant === "empty"
            ? "min-h-[2.5rem] py-2 text-sm leading-relaxed"
            : "min-h-[2rem] py-1 text-xs leading-relaxed"
        }`}
      />
      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className={`flex flex-shrink-0 items-center justify-center transition-all ${
          variant === "empty"
            ? "mb-0.5 h-10 w-10 rounded-xl"
            : "mb-0.5 h-9 w-9 rounded-lg"
        } ${
          !input.trim() || isLoading
            ? "bg-app-tab-track text-app-muted cursor-not-allowed"
            : "bg-violet-600 text-white shadow-md shadow-violet-500/20 active:scale-90 cursor-pointer"
        }`}
      >
        <PaperPlaneRight size={16} weight="fill" />
      </button>
    </form>
  );

  const isPageReady = isUserLoaded && isHydrated;

  return (
    <div className="flex flex-col bg-app-bg text-app-text min-h-[calc(100vh-12rem)] pb-24 relative">
      {/* Header Panel Actions */}
      <div className="flex items-center justify-between pb-3.5 border-b border-app-border/60 shrink-0">
        <h2 className="text-sm font-black text-app-text uppercase tracking-wider flex items-center gap-1.5">
          <Sparkle size={18} weight="fill" className="text-violet-500" />
          <span>AI <span className="text-violet-500">Asistan</span></span>
        </h2>
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="p-2 rounded-xl text-app-muted hover:text-app-text hover:bg-app-surface border border-app-border active:scale-95 transition-all duration-200 shadow-sm"
          aria-label="Sohbet geçmişi"
        >
          <ClockCounterClockwise size={16} weight="bold" />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 mt-4">
        {!isPageReady ? (
          <div className="flex items-center justify-center py-20">
            <Sparkle
              size={24}
              weight="fill"
              className="text-violet-500 animate-spin"
            />
          </div>
        ) : null}

        {isPageReady && isEmptyChat && (
          <div className="flex flex-col items-center justify-center py-12 gap-6 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-violet-500/10 flex items-center justify-center text-violet-500">
              <Robot size={36} weight="fill" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black tracking-tight text-app-text">
                Sana Nasıl Yardımcı Olabilirim?
              </h3>
              <p className="text-xs text-app-muted max-w-[280px] mx-auto leading-relaxed">
                Yemek planı yapabilir, ev işlerini organize edebilir veya sorularını yanıtlayabilirim.
              </p>
            </div>
            {renderChatInput("empty")}
          </div>
        )}

        {isPageReady && !isEmptyChat && (
          <div className="space-y-4 pb-20">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-2.5 max-w-[85%] ${
                      message.role === "assistant" && message.cards?.length
                        ? "w-full"
                        : ""
                    } ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center shadow-xs ${
                        message.role === "user"
                          ? "bg-app-surface border border-app-border text-app-text"
                          : "bg-violet-600 text-white"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User size={13} weight="bold" />
                      ) : (
                        <Sparkle size={13} weight="fill" />
                      )}
                    </div>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl shadow-xs min-w-0 ${
                        message.role === "user"
                          ? "bg-violet-600 text-white rounded-tr-none"
                          : "bg-app-surface border border-app-border text-app-text rounded-tl-none"
                      } ${
                        message.role === "assistant" && message.cards?.length
                          ? "w-full"
                          : ""
                      }`}
                    >
                      <ChatMessageContent
                        content={message.content}
                        className={`text-xs leading-relaxed font-semibold ${
                          message.role === "user" ? "text-white" : "text-app-text"
                        }`}
                      />
                      {message.role === "assistant" && message.cards?.length ? (
                        <div className="mt-3">
                          <AssistantCardGallery cards={message.cards} userId={userId || undefined} />
                        </div>
                      ) : null}
                      <span
                        className={`text-[9px] mt-1.5 block opacity-50 font-bold ${
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

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex gap-2.5 max-w-[85%]">
                  <div className="w-7 h-7 rounded-lg bg-violet-600 flex-shrink-0 flex items-center justify-center shadow-xs text-white">
                    <Sparkle size={13} weight="fill" className="animate-spin" />
                  </div>
                  <div className="px-3.5 py-2 rounded-2xl bg-app-surface border border-app-border shadow-xs rounded-tl-none">
                    <div className="flex gap-1 py-1">
                      <div className="w-1 h-1 bg-violet-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1 h-1 bg-violet-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Fixed Chat Input for Compact Mode */}
      {isPageReady && !isEmptyChat && (
        <div className="fixed bottom-[72px] left-0 right-0 z-40 bg-app-bg/90 backdrop-blur-md border-t border-app-border/40 p-3 max-w-lg mx-auto w-full">
          {renderChatInput("compact")}
        </div>
      )}

      {/* History Drawer Modal */}
      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[160]"
              aria-label="Kapat"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="chat-history-title"
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed left-1/2 top-1/2 z-[170] flex w-[calc(100%-2rem)] max-w-sm max-h-[80vh] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-app-surface border border-app-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-app-border shrink-0">
                <h2 id="chat-history-title" className="text-sm font-black text-app-text uppercase tracking-wider">
                  Sohbet Geçmişi
                </h2>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="p-1.5 hover:bg-app-surface-muted rounded-lg border border-app-border transition-colors text-app-muted"
                  aria-label="Kapat"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              <button
                type="button"
                onClick={startNewChat}
                className="mx-5 mt-4 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-white font-bold text-xs shadow-md shadow-violet-500/20 active:scale-[0.98] transition-transform shrink-0"
              >
                <Plus size={16} weight="bold" />
                <span>Yeni Sohbet Başlat</span>
              </button>

              <div className="flex-1 overflow-y-auto px-4 py-4 mt-2 min-h-0">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ChatCircle
                      size={36}
                      weight="duotone"
                      className="text-app-muted mb-3"
                    />
                    <p className="text-xs font-bold text-app-muted">
                      Kayıtlı sohbet bulunamadı
                    </p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {conversations.map((conversation) => {
                      const isActive = conversation.id === chatId;
                      return (
                        <li key={conversation.id}>
                          <div
                            className={`flex items-center gap-1 rounded-2xl border transition-colors ${
                              isActive
                                ? "bg-violet-500/5 border-violet-500/20"
                                : "bg-app-surface-muted border-app-border hover:bg-app-surface"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => openConversation(conversation)}
                              className="flex-1 min-w-0 text-left px-3.5 py-3"
                            >
                              <p
                                className={`text-xs font-black truncate ${
                                  isActive ? "text-violet-500" : "text-app-text"
                                }`}
                              >
                                {conversation.title}
                              </p>
                              <p className="text-[9px] font-bold text-app-muted mt-0.5">
                                {formatListDate(conversation.updatedAt)}
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={(e) =>
                                handleDeleteConversation(e, conversation.id)
                              }
                              className="flex-shrink-0 p-2 mr-2 rounded-xl text-app-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              aria-label="Sohbeti sil"
                            >
                              <Trash size={14} weight="bold" />
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
    </div>
  );
}
