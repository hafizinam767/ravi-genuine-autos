'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Loader2 } from 'lucide-react';
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
    "Hello! I'm your Ravi Genuine Autos assistant. I can help you find the right parts for your vehicle. What are you looking for?",
};

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
    // Use scrollIntoView for reliable scrolling on all devices
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  }, [messages, isLoading]);

  // Handle mobile keyboard viewport resize
  useEffect(() => {
    if (!showChat) return;

    const handleResize = () => {
      // On mobile, adjust chat panel height to visual viewport
      if (chatPanelRef.current && window.visualViewport) {
        const vv = window.visualViewport;
        const isSmallScreen = window.innerWidth < 640; // sm breakpoint
        if (isSmallScreen) {
          chatPanelRef.current.style.height = `${vv.height}px`;
        }
      }
      // Scroll to bottom after resize
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

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: updatedMessages.slice(0, -1),
        }),
      });

      const data = await res.json();
      const botMessage: ChatMessage = {
        role: 'assistant',
        content:
          data.response ||
          'Sorry, I could not process your request. Please try again or contact us at M.Zulfiqar 0320-0408917.',
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content:
          'I apologize, but I am having trouble connecting right now. Please contact us directly at M.Zulfiqar 0320-0408917 for assistance.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

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
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 hover:shadow-xl active:scale-95 transition-colors"
            aria-label="Open chat assistant"
          >
            <Bot className="h-7 w-7" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-amber-500" />
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
            className="fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col sm:bottom-6 sm:right-6 sm:h-[560px] sm:w-[380px] sm:rounded-2xl sm:shadow-2xl border border-border bg-background overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-amber-500 px-4 py-3">
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
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100">
                        <Bot className="h-4 w-4 text-amber-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        msg.role === 'user'
                          ? 'rounded-br-md bg-amber-500 text-white'
                          : 'rounded-bl-md bg-muted text-foreground'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100">
                      <Bot className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-amber-500 [animation-delay:0ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-amber-500 [animation-delay:150ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-amber-500 [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Scroll anchor */}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t bg-background px-4 py-3">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about parts..."
                  disabled={isLoading}
                  className="flex-1 rounded-full border-border bg-muted/50 px-4 py-2 text-sm focus-visible:ring-amber-500"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50"
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
                AI may make mistakes. Contact{' '}
                <span className="font-medium text-amber-600">
                  0320-0408917
                </span>{' '}
                for direct assistance.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
