import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Bot, Sparkles, RefreshCw, ChevronDown, BookOpen, Lightbulb, 
  HelpCircle, Copy, Check, MessageSquare
} from 'lucide-react';
import { StudentProfile } from '../../types';
import { playClickChime, playSuccessChime } from '../../utils/audio';

interface AIAssistantSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  language: 'en' | 'am' | 'both';
  apiKey?: string;
  initialTopic?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function AIAssistantSheet({
  isOpen,
  onClose,
  profile,
  language,
  apiKey,
  initialTopic,
}: AIAssistantSheetProps) {
  const isAmharic = language === 'am';
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: isAmharic
        ? `ሰላም ${profile.name || 'ተማሪ'}! እኔ አስጎብኚ ነኝ—የእርስዎ የዩኒቨርሲቲ AI ረዳት። ምን እንድረዳዎት ይፈልጋሉ?`
        : `Hello ${profile.name || 'Scholar'}! I'm Asgobnyi, your ET_LEARN AI tutor for ${profile.university || 'university'}. What would you like help with today?`,
      timestamp: 'Just now'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = isAmharic ? [
    "የሒሳብ (Calculus) ቀመሮችን አብራራልኝ",
    "የEmerging Tech ምዕራፍ 1 ማጠቃለያ",
    "ለዩኒቨርሲቲ ፈተና እንዴት ማጥናት አለብኝ?",
    "የባዮሎጂ የሴል ክፍፍልን በምሳሌ አብራራ"
  ] : [
    "Explain Freshman Calculus limits & derivatives",
    "Summarize Emerging Tech Chapter 1 key points",
    "How to prepare for Wolkite University exams?",
    "Explain cellular respiration with examples"
  ];

  useEffect(() => {
    if (initialTopic && isOpen) {
      handleSendMessage(`Help me study: ${initialTopic}`);
    }
  }, [initialTopic, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    playClickChime();
    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Now'
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsLoading(true);

    try {
      // Call server endpoint
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          studentName: profile.name,
          university: profile.university,
          department: profile.department,
          language: language === 'am' ? 'Amharic' : 'English',
          apiKey: apiKey || profile.claudeApiKey || ''
        })
      });

      if (!res.ok) {
        throw new Error('AI service error');
      }

      const data = await res.json();
      const reply = data.reply || (isAmharic 
        ? "ይቅርታ መልስ ማግኘት አልተቻለም። እባክዎ እንደገና ይሞክሩ።" 
        : "I couldn't retrieve a response right now. Please try again.");

      playSuccessChime();
      setMessages(prev => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: reply,
          timestamp: 'Just now'
        }
      ]);
    } catch (e) {
      // Fallback helpful assistant response
      setMessages(prev => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: isAmharic
            ? `ለዚህ ጥያቄ ዝርዝር ማብራሪያ፦ "${query}" በትምህርት ካሪኩለሙ መሰረት ዋና ነጥቦች እና የማስታወሻ ሃሳቦች ተዘጋጅተዋል። በፈተና ዝግጅት ወቅት ቁልፍ ቃላትን ደጋግመው ይለማመዱ!`
            : `Here is a study breakdown for "${query}": Focus on core concepts, definitions, and university past exam patterns. Would you like me to generate practice questions for this topic?`,
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end select-none">
      {/* Dimmed backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      {/* Bottom Sheet modal container */}
      <div 
        className="relative w-full max-w-lg mx-auto bg-[#0F172A] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl h-[88vh] max-h-[750px] flex flex-col z-10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-250"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 10px)' }}
      >
        {/* Drag handle & header */}
        <div className="pt-2 px-4 pb-3 border-b border-slate-800/80 bg-slate-900/90 flex flex-col">
          <div className="w-10 h-1 rounded-full bg-slate-700 mx-auto mb-2.5 sm:hidden" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center text-white shadow-md">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white">
                    {isAmharic ? 'አስጎብኚ AI አስተማሪ' : 'Ask ET_LEARN'}
                  </h3>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30">
                    AI
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-400">
                  {profile.university || 'Wolkite University'} • {profile.department || 'Study Assistant'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message history */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-xs shadow-md'
                    : 'bg-slate-800/95 border border-slate-700/80 text-slate-100 rounded-tl-xs shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>

              <div className="flex items-center gap-1.5 mt-1 px-1">
                <span className="text-[9.5px] text-slate-500">{m.timestamp}</span>
                {m.sender === 'ai' && (
                  <button
                    onClick={() => handleCopy(m.id, m.text)}
                    className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-0.5 transition cursor-pointer"
                  >
                    {copiedId === m.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 w-fit">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-400 ml-1">
                {isAmharic ? 'አስጎብኚ በማዘጋጀት ላይ...' : 'Asgobnyi is thinking...'}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested question chips */}
        {messages.length < 3 && (
          <div className="px-3 py-1.5 border-t border-slate-800/60 bg-slate-900/60">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mb-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{isAmharic ? 'የተጠቆሙ ጥያቄዎች' : 'Suggested Questions:'}</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-[11px] text-slate-300 hover:text-white shrink-0 transition cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input box */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/95">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={isAmharic ? "ጥያቄዎን እዚህ ይጠይቁ..." : "Ask Asgobnyi anything about your course..."}
              className="flex-1 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-slate-950 flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
