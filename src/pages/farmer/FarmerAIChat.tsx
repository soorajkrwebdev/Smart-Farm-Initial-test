import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { aiService } from '../../services/aiService';
import { AIMessage } from '../../types';
import { Sparkles, Send, Mic, RefreshCw, Bot, User } from 'lucide-react';

export const FarmerAIChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'init-farmer-ai',
      role: 'assistant',
      content: `Namaskara ${user?.name || 'Farmer'}! I am **FarmAI**, your intelligent agricultural assistant. I am connected directly to your FarmNexa data, local mandi rates, and district weather models.\n\nAsk me about today's mandi commodity prices, weather spray windows, finding workers, or checking your pending orders!`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestedFarmerPrompts = [
    "What is today's Pepper price in Sullia mandi?",
    "Check weather & spray advisory for tomorrow",
    "Find available arecanut climbers nearby",
    "Show my pending customer orders",
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: AIMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await aiService.sendMessage(query, 'farmer', {
        userId: user?.id,
        district: user?.district || 'Dakshina Kannada',
      });
      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        tool_calls: res.toolCalls,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an issue retrieving that data. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">FarmAI — Agricultural Decision Assistant</h1>
            <p className="text-xs text-gray-500">Connected to Mandi Benchmarks, Weather Advisories & Farm Data</p>
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Session</span>
        </button>
      </div>

      {/* Suggested Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {suggestedFarmerPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(p)}
            className="px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs font-semibold whitespace-nowrap hover:bg-emerald-100 transition-colors"
          >
            "{p}"
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="bg-white rounded-3xl border border-gray-200 p-4 sm:p-6 shadow-xs h-[500px] overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-xl space-y-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Tool Execution Pill */}
              {m.tool_calls && m.tool_calls.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {m.tool_calls.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-200 flex items-center gap-1"
                    >
                      <span>⚡ Executed: {t.tool_name}</span>
                    </span>
                  ))}
                </div>
              )}

              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                  m.role === 'user'
                    ? 'bg-emerald-800 text-white rounded-tr-xs'
                    : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-tl-xs'
                }`}
              >
                {m.content}
              </div>
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-gray-400 pl-11">
            <span className="animate-pulse">FarmAI is executing agricultural tools...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Ask about mandi prices, weather planning, workers, or your orders..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none shadow-xs"
          />
          <button
            type="button"
            onClick={() => alert('Voice assistant input (Kannada/English) will be available in future phase.')}
            className="absolute right-3 top-3 text-gray-400 hover:text-emerald-700"
            title="Voice input ready"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="p-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
