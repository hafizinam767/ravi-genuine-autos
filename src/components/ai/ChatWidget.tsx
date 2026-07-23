'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/lib/store';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    "Hello! I'm your Ravi Genuine Autos assistant. I can help you find exact genuine parts for your vehicle, check stock, pricing, and compatibility. What are you looking for today?",
};

function ChatMessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <>{content}</>;
  }

  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        ul: ({ children }) => <ul className="my-1 list-disc pl-4">{children}</ul>,
        ol: ({ children }) => <ol className="my-1 list-decimal pl-4">{children}</ol>,
        li: ({ children }) => <li className="mb-0.5">{children}</li>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

const SUGGESTED_PROMPTS = [
  'Suzuki Alto Brake Pads',
  'Honda Civic Air Filter',
  'Toyota Corolla Parts',
  'Shop Location & Hours',
];

export default function ChatWidget() {
  const { showChat, setShowChat } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  }, [messages, isLoading]);

  // Handle mobile keyboard viewport resize
  useEffect(() => {
    if (!showChat) return;

    const handleResize = () => {
      if (chatPanelRef.current && window.visualViewport) {
        const vv = window.visualViewport;
        const isSmallScreen = window.innerWidth < 640;
        if (isSmallScreen) {
          chatPanelRef.current.style.height = `${vv.height}px`;
        }
      }
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    };

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handleResize);
      vv.addEventListener('scroll', handleResize);
    }

    return () => {
      if (vv) {
        vv.removeEventListener('resize', handleResize);
        vv.removeEventListener('scroll', handleResize);
      }
    };
  }, [showChat]);

  // Focus input when chat opens
  useEffect(() => {
    if (showChat && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [showChat]);

  const sendQuery = useCallback(async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const historyForApi = updatedMessages
        .slice(0, -1)
        .filter((msg) => msg.content !== WELCOME_MESSAGE.content);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyForApi,
        }),
      });

      const data = await res.json();
      const botMessage: ChatMessage = {
        role: 'assistant',
        content:
          data.response ||
          'Sorry, I could not process your request. Please contact us at Mehar Zulfeqar Ali 0320-0408917 / 0332-4131636.',
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content:
          'I apologize, but I am having trouble connecting right now. Please contact us directly at Mehar Zulfeqar Ali 0320-0408917 / 0332-4131636 for assistance.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages]);

  const sendMessage = useCallback(() => {
    sendQuery(input);
  }, [input, sendQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!showChat && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setShowChat(true)}
            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg hover:shadow-xl active:scale-95 transition-colors"
            style={{ backgroundColor: '#B91C1C' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
            aria-label="Open chat assistant"
          >
            <Bot className="h-5.5 w-5.5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-red-700" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            ref={chatPanelRef}
            className="fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col border border-border bg-background overflow-hidden sm:bottom-6 sm:right-6 sm:h-[580px] sm:w-[400px] sm:rounded-2xl sm:shadow-2xl"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b px-4 py-3"
              style={{ backgroundColor: '#B91C1C' }}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Ravi Auto Assistant
                  </h3>
                  <p className="text-xs text-white/80">Always here to help</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChat(false)}
                className="h-8 w-8 text-white hover:bg-white/20"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 scroll-smooth"
              style={{
                WebkitOverflowScrolling: 'touch',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              <div className="flex flex-col gap-3">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-end gap-2 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">
                        <Bot className="h-4 w-4 text-red-700" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        msg.role === 'user'
                          ? 'rounded-br-md bg-red-700 text-white'
                          : 'rounded-bl-md bg-muted text-foreground'
                      }`}
                    >
                      <ChatMessageContent content={msg.content} isUser={msg.role === 'user'} />
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <Bot className="h-4 w-4 text-red-700" />
                    </div>
                    <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-red-700 [animation-delay:0ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-red-700 [animation-delay:150ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-red-700 [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </div>

            {/* Quick Suggestions Pills */}
            {messages.length < 3 && !isLoading && (
              <div className="flex flex-wrap gap-1.5 px-3 py-1.5 bg-muted/30 border-t border-border">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendQuery(prompt)}
                    className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-background px-2.5 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Sparkles className="h-3 w-3" />
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="border-t bg-background px-4 py-3">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about parts, models, prices..."
                  disabled={isLoading}
                  className="flex-1 rounded-full border-border bg-muted/50 px-4 py-2 text-sm focus-visible:ring-red-700"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full disabled:opacity-50"
                  style={{ backgroundColor: '#B91C1C' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
                Call for orders:{' '}
                <span className="font-medium text-red-700">
                  Mehar Zulfeqar Ali 0320-0408917 / 0332-4131636
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
