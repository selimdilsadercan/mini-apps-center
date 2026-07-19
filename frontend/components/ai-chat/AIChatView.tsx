"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkle,
  PaperPlaneRight,
  User,
  Trash,
} from "@phosphor-icons/react";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type ChatMessage,
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

export function AIChatView() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
      await upsertConversation(id, msgs, userId);
    },
    [userId]
  );

  useEffect(() => {
    if (!isUserLoaded) return;

    let cancelled = false;

    async function init() {
      const list = await loadConversations(userId);
      if (cancelled) return;

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

  const clearChat = async () => {
    if (!chatId) return;
    const wasActive = true;
    const newId = createConversationId();
    setChatId(newId);
    setActiveChatId(newId);
    setMessages([]);

    try {
      await deleteConversation(chatId, userId);
      toast.success("Sohbet temizlendi.");
    } catch (e) {
      console.error(e);
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

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const isPageReady = isUserLoaded && isHydrated;

  return (
    <div className="flex flex-col rounded-3xl border border-app-border bg-app-surface shadow-lg overflow-hidden min-h-[460px] max-h-[560px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-app-border bg-app-surface-muted/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Sparkle size={16} weight="fill" />
          </div>
          <div>
            <h3 className="text-xs font-black text-app-text tracking-tight uppercase">AI Assistant</h3>
            <p className="text-[9px] font-bold text-app-muted">All-in-one Akıllı Yardımcı</p>
          </div>
        </div>

        {!isEmptyChat && (
          <button
            type="button"
            onClick={clearChat}
            className="p-1.5 rounded-lg border border-white/20 text-app-muted hover:text-red-500 hover:bg-red-500/10 active:scale-95 transition-all"
            title="Sohbeti Temizle"
          >
            <Trash size={14} weight="bold" />
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {!isPageReady ? (
          <div className="h-full flex items-center justify-center">
            <Sparkle size={28} weight="fill" className="text-violet-500 animate-pulse" />
          </div>
        ) : isEmptyChat ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center border border-violet-500/20 shadow-inner">
              <Sparkle size={24} weight="fill" />
            </div>
            <div>
              <h4 className="text-xs font-black text-app-text tracking-tight uppercase">Akıllı Asistanınız Hazır</h4>
              <p className="text-[10px] text-app-muted font-bold max-w-[240px] mx-auto mt-1">
                Egzersizler, yemek planları, günlük yapılacaklar veya merak ettiğin her şeyi sorabilirsin.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-2 max-w-[85%] ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center shadow-xs text-[10px] font-black ${
                      message.role === "user" ? "bg-app-surface-muted border border-app-border text-app-text" : "bg-violet-600 text-white"
                    }`}
                  >
                    {message.role === "user" ? <User size={12} weight="bold" /> : <Sparkle size={12} weight="fill" />}
                  </div>
                  <div
                    className={`px-3 py-2 rounded-2xl shadow-xs min-w-0 ${
                      message.role === "user"
                        ? "bg-violet-600 text-white rounded-tr-none text-xs"
                        : "bg-app-surface-muted border border-app-border text-app-text rounded-tl-none text-xs"
                    }`}
                  >
                    <ChatMessageContent
                      content={message.content}
                      className={`text-[12px] leading-relaxed font-bold ${
                        message.role === "user" ? "text-white" : "text-app-text"
                      }`}
                    />
                    {message.role === "assistant" && message.cards?.length ? (
                      <div className="mt-3 border-t border-app-border/40 pt-3">
                        <AssistantCardGallery cards={message.cards} userId={userId} />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg bg-violet-600 flex-shrink-0 flex items-center justify-center shadow-xs">
                    <Sparkle size={12} weight="fill" color="white" className="animate-pulse" />
                  </div>
                  <div className="px-3 py-2 rounded-2xl bg-app-surface-muted border border-app-border shadow-xs rounded-tl-none flex items-center justify-center">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-violet-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1 h-1 bg-violet-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      {isPageReady && (
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-app-border bg-app-surface-muted/30 flex items-end gap-2 shrink-0"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            rows={1}
            placeholder="Asistana sor..."
            className="max-h-20 flex-1 resize-none overflow-y-auto rounded-xl border border-app-border bg-app-surface px-3 py-2 text-[11px] font-bold text-app-text focus:outline-none placeholder:text-app-muted focus:border-violet-500/50 transition-all min-h-[36px]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              !input.trim() || isLoading
                ? "bg-app-surface-muted text-app-muted border border-app-border"
                : "bg-violet-600 text-white shadow-md active:scale-95 hover:bg-violet-700"
            }`}
          >
            <PaperPlaneRight size={14} weight="fill" />
          </button>
        </form>
      )}
    </div>
  );
}
