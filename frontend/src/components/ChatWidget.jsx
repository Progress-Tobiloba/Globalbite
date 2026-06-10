import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ChefHat } from 'lucide-react';

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-end gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted inline-block"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.18,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── Individual Message Bubble ────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-olive flex items-center justify-center mr-2 mt-1 flex-shrink-0">
          <ChefHat size={12} className="text-cream" strokeWidth={1.5} />
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 text-sm font-body leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-charcoal text-cream'
            : 'bg-surface text-charcoal'
        }`}
        style={{ borderRadius: isUser ? '12px 2px 12px 12px' : '2px 12px 12px 12px' }}
      >
        {msg.content}
        {msg.streaming && (
          <motion.span
            className="inline-block w-0.5 h-3.5 bg-current ml-0.5 align-middle"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
}

// ─── ChatWidget ───────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Ciao! 👨‍🍳 I'm Chef Bite. Ask me anything about cooking — recipes, techniques, substitutions — I'm all yours!",
      streaming: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [streamError, setStreamError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const readerRef = useRef(null);

  // ─── Auto-scroll to bottom ────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, scrollToBottom]);

  // ─── Focus input when chat opens ──────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // ─── Abort stream on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (readerRef.current) {
        readerRef.current.cancel().catch(() => {});
      }
    };
  }, []);

  // ─── Send message & stream response ──────────────────────────────────
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isThinking) return;

    setStreamError('');
    setInput('');

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      streaming: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    // Build history for context (exclude welcome message, exclude streaming flag)
    const history = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }));

    const assistantMsgId = `assistant-${Date.now()}`;

    try {
      const BASE = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(BASE + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body for streaming.');
      }

      // Add empty assistant message that we'll fill in
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: 'assistant', content: '', streaming: true },
      ]);
      setIsThinking(false);

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last (possibly incomplete) line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.slice(6).trim();
            if (!rawData) continue;

            try {
              const parsed = JSON.parse(rawData);

              if (parsed.text) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: m.content + parsed.text }
                      : m
                  )
                );
              }

              if (parsed.message && line.startsWith('event: done')) {
                // stream complete — handled below
              }

              if (parsed.message && line.includes('event: error')) {
                setStreamError(parsed.message);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: parsed.message || 'Something went wrong.', streaming: false }
                      : m
                  )
                );
              }
            } catch {
              // Non-JSON lines from SSE (like event: lines) — safe to skip
            }
          }

          // Check event type separately
          if (line.startsWith('event: done')) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, streaming: false } : m
              )
            );
          }

          if (line.startsWith('event: error')) {
            // Will be caught in data parsing above
          }
        }
      }

      // Finalize streaming state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, streaming: false } : m
        )
      );
    } catch (err) {
      console.error('[ChatWidget] Stream error:', err.message);
      setIsThinking(false);

      const errorText = err.message.includes('Failed to fetch')
        ? 'Could not connect to the server. Is the backend running?'
        : 'Something went wrong. Please try again.';

      setStreamError(errorText);

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === assistantMsgId);
        if (exists) {
          return prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: errorText, streaming: false }
              : m
          );
        }
        return [
          ...prev,
          { id: assistantMsgId, role: 'assistant', content: errorText, streaming: false },
        ];
      });
    }
  }, [input, isThinking, messages]);

  // ─── Keyboard send ────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Toggle open/close ────────────────────────────────────────────────
  const handleClose = () => {
    if (readerRef.current) {
      readerRef.current.cancel().catch(() => {});
      readerRef.current = null;
    }
    setIsThinking(false);
    setMessages((prev) =>
      prev.map((m) => ({ ...m, streaming: false }))
    );
    setIsOpen(false);
  };

  return (
    <>
      {/* ── Floating Bubble Button ─────────────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="fab"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              boxShadow: [
                '0 4px 20px rgba(28,28,30,0.18)',
                '0 8px 32px rgba(28,28,30,0.28)',
                '0 4px 20px rgba(28,28,30,0.18)',
              ],
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              scale: { type: 'spring', stiffness: 360, damping: 24 },
              boxShadow: {
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-charcoal text-cream flex items-center justify-center rounded-full focus-visible:outline-none"
            aria-label="Open Chef Bite AI chat"
          >
            <ChefHat size={24} strokeWidth={1.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel (morphs from button position) ───────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            layoutId="chat-container"
            initial={{ opacity: 0, scale: 0.85, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-5rem)] bg-white flex flex-col overflow-hidden"
            style={{ boxShadow: '0 20px 60px rgba(28,28,30,0.18)' }}
          >
            {/* ── Panel Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface bg-cream flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-olive flex items-center justify-center">
                  <ChefHat size={14} className="text-cream" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-body font-medium text-charcoal text-sm leading-none">
                    Chef Bite
                  </p>
                  <p className="font-body text-muted text-xs mt-0.5">AI Culinary Assistant</p>
                </div>
              </div>
              <motion.button
                onClick={handleClose}
                whileTap={{ scale: 0.88 }}
                className="text-muted hover:text-charcoal transition-colors p-1"
                aria-label="Close chat"
              >
                <X size={18} strokeWidth={1.5} />
              </motion.button>
            </div>

            {/* ── Messages ─────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              {/* Thinking indicator */}
              <AnimatePresence>
                {isThinking && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start mb-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-olive flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                      <ChefHat size={12} className="text-cream" strokeWidth={1.5} />
                    </div>
                    <div className="bg-surface" style={{ borderRadius: '2px 12px 12px 12px' }}>
                      <TypingDots />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* ── Stream Error ──────────────────────────────────────────── */}
            <AnimatePresence>
              {streamError && (
                <motion.p
                  key="stream-err"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-2 text-error text-xs font-body border-t border-surface/50 flex-shrink-0"
                >
                  {streamError}
                </motion.p>
              )}
            </AnimatePresence>

            {/* ── Input ────────────────────────────────────────────────── */}
            <div className="flex items-end gap-2 px-3 py-3 border-t border-surface flex-shrink-0">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about food…"
                rows={1}
                disabled={isThinking}
                className="flex-1 resize-none bg-surface text-charcoal font-body text-sm px-3 py-2.5 outline-none placeholder-muted disabled:opacity-50 focus:ring-1 focus:ring-charcoal/20 transition-shadow"
                style={{
                  borderRadius: '6px',
                  maxHeight: '96px',
                  overflowY: 'auto',
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
                }}
              />
              <motion.button
                onClick={sendMessage}
                disabled={!input.trim() || isThinking}
                whileTap={{ scale: 0.88 }}
                className="w-9 h-9 bg-charcoal text-cream flex items-center justify-center rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
                aria-label="Send message"
              >
                <Send size={15} strokeWidth={1.5} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
