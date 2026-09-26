import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Trash2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { safeStorage } from '../utils/safeStorage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface SupportChatBubbleProps {
  language: 'en' | 'am';
  studentName?: string;
  apiKey?: string;
}

export default function SupportChatBubble({ language, studentName, apiKey }: SupportChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat history and default greeting
  useEffect(() => {
    const saved = safeStorage.getItem('ethiolearn_support_chat');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If cached chat contains outdated informal greetings or Ezra references, refresh to formal greeting
        const isOutdated = parsed.some((m: Message) => 
          m.content.includes('Ezra') || 
          m.content.includes('Hello my friend') || 
          m.content.includes('ሰላም ጓደኛዬ') ||
          m.content.includes('Selamalekum')
        );
        if (isOutdated) {
          initializeGreeting();
        } else {
          setMessages(parsed);
        }
      } catch (e) {
        initializeGreeting();
      }
    } else {
      initializeGreeting();
    }
  }, [studentName, language]);

  const initializeGreeting = () => {
    const greetingText = language === 'en'
      ? `Greetings${studentName ? `, ${studentName}` : ''}. I am Abreham, lead developer and academic advisor at EthioLearn. How may I assist you with your academic studies, exam preparation, or platform inquiries today?`
      : `ጤና ይስጥልኝ${studentName ? ` ${studentName}` : ''}። እኔ አብርሃም፤ የኢትዮለርን መሐንዲስ እና የአካዳሚክ አማካሪ ነኝ። በዛሬው ዕለት በትምህርትዎ፣ በፈተና ዝግጅትዎ ወይም በመድረኩ አጠቃቀም ዙሪያ እንዴት ልረዳዎ እችላለሁ?`;

    const initial: Message = {
      id: 'greeting-id',
      role: 'assistant',
      content: greetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([initial]);
    safeStorage.setItem('ethiolearn_support_chat', JSON.stringify([initial]));
  };

  // Scroll to bottom whenever messages list updates or typing state changes
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const handleToggle = () => {
    playClickChime();
    setIsOpen(!isOpen);
    setChatError(null);
  };

  const handleClearChat = () => {
    playClickChime();
    if (window.confirm(language === 'en' ? "Do you want to reset your conversation with Abreham?" : "ከአብርሃም ጋር ያለውን ውይይት ማጽዳት ይፈልጋሉ?")) {
      safeStorage.removeItem('ethiolearn_support_chat');
      initializeGreeting();
      setChatError(null);
      playSuccessChime();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    playClickChime();
    setInputText('');
    setChatError(null);

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    safeStorage.setItem('ethiolearn_support_chat', JSON.stringify(updated));

    // Show typing state
    setIsTyping(true);

    try {
      // Proxy backend post to server Support Chat endpoint
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          apiKey
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server support chat error');
      }

      const data = await response.json();
      
      const assistantMsg: Message = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: data.reply || (language === 'am' ? 'ሰላም፣ ጥያቄዎን ተቀብለናል። እንዴት ልርዳዎት?' : 'Greetings, how can I assist you today?'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...updated, assistantMsg];
      setMessages(finalMessages);
      safeStorage.setItem('ethiolearn_support_chat', JSON.stringify(finalMessages));
      playSuccessChime();
    } catch (err: any) {
      console.error('[Support Chat Bubble Error]:', err);
      setChatError(language === 'en' 
        ? "Could not connect to academic advisor. Please verify your connection or try again." 
        : "ከአካዳሚክ ረዳት ጋር መገናኘት አልተቻለም። እባክዎን የኢንተርኔት ግንኙነትዎን ያረጋግጡ ወይም እንደገና ይሞክሩ።"
      );
      playFailureChime();
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-22 sm:right-6 z-40 font-sans" id="support-chat-wrapper">
      {/* Floating Chat Bubble Button: 48px diameter with subtle shadow */}
      <motion.button
        id="support-chat-bubble-btn"
        onClick={handleToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full flex items-center justify-center shadow-md hover:shadow-lg border border-amber-300/40 cursor-pointer relative transition-colors"
        title={language === 'en' ? "Academic Support Advisor" : "የአካዳሚክ ድጋፍ አማካሪ"}
      >
        {isOpen ? (
          <X className="w-5 h-5 stroke-[2.2px]" />
        ) : (
          <>
            <MessageCircle className="w-5 h-5 stroke-[2.2px]" />
            {/* Subtle online status indicator */}
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0B1228]" />
          </>
        )}
      </motion.button>

      {/* Floating Chat Panel Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="support-chat-drawer-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-14 right-0 w-[calc(100vw-2rem)] sm:w-[360px] max-w-[360px] h-[440px] max-h-[calc(100vh-140px)] bg-[#111C35] rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-3.5 bg-[#0B1228] border-b border-slate-700/80 flex items-center justify-between">
              {/* National Accents */}
              <div className="absolute top-0 inset-x-0 h-1 flex">
                <div className="bg-emerald-500 h-full w-1/3" />
                <div className="bg-amber-400 h-full w-1/3" />
                <div className="bg-red-500 h-full w-1/3" />
              </div>

              <div className="flex items-center gap-3 pt-1">
                {/* Avatar Portrait for Abreham */}
                <div className="relative w-10 h-10 rounded-full bg-zinc-800 border-2 border-[#C8962E] flex items-center justify-center overflow-hidden">
                  <span className="text-lg">🧔</span>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-900" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif font-extrabold text-sm text-[#F0EDE8]">Abreham (EthioLearn Creator)</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#C8962E] fill-[#C8962E]/20" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Active Academic Advisor</span>
                </div>
              </div>

              {/* Reset/Clear Button */}
              <button
                onClick={handleClearChat}
                className="p-2 text-zinc-500 hover:text-red-400 transition-colors rounded-lg hover:bg-zinc-900"
                title={language === 'en' ? "Clear Chat History" : "ታሪክ አጽዳ"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message banner */}
            {chatError && (
              <div className="px-4 py-2 bg-red-950/20 border-b border-red-900/30 text-red-400 text-xs flex items-center gap-2 font-sans">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <p className="leading-tight">{chatError}</p>
              </div>
            )}

            {/* Message Area */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 scrollbar-thin bg-radial-gradient" id="chat-messages-container">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed font-sans ${
                        m.role === 'user'
                          ? 'bg-[#C8962E] text-black font-semibold rounded-tr-none shadow-[0_2px_12px_rgba(200,150,46,0.15)]'
                          : 'bg-zinc-900 text-zinc-200 rounded-tl-none border border-zinc-850'
                      }`}
                    >
                      {/* Formatted inline blocks to preserve linebreaks nicely */}
                      <p className="whitespace-pre-line">{m.content}</p>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-650 mt-1 px-1">{m.timestamp}</span>
                  </div>
                </div>
              ))}

              {/* typing animation */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex flex-col items-start max-w-[80%]">
                    <div className="px-4 py-3 bg-zinc-900 text-zinc-400 rounded-2xl rounded-tl-none border border-zinc-850 flex items-center gap-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse text-zinc-400">
                        {language === 'en' ? "Abreham is replying" : "አብርሃም እየመለሰ ነው"}
                      </span>
                      <div className="flex gap-1 items-center justify-center pl-1">
                        <div className="w-1.5 h-1.5 bg-[#C8962E] rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-[#C8962E] rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-[#C8962E] rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-zinc-950 border-t border-zinc-900 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={language === 'en' ? "Ask Abreham something..." : "አብርሃምን አንድ ነገር ጠይቀው..."}
                className="flex-grow bg-zinc-900 border border-zinc-800 focus:border-[#C8962E] rounded-xl px-4 py-2 text-xs text-zinc-100 outline-none transition-all placeholder:text-zinc-600 font-sans"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="w-9 h-9 shrink-0 bg-[#C8962E] hover:bg-[#b08123] disabled:opacity-30 text-black rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title={language === 'en' ? "Send Message" : "ላክ"}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
