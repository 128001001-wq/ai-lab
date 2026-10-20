import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ModelMetrics } from '../types/concrete';
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  HardHat,
  AlertCircle,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';

interface AIAssistantProps {
  modelMetrics?: ModelMetrics;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ modelMetrics }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      timestamp: Date.now(),
      text: `Welcome to the **Concrete Strength AI Lab Assistant** (Exercise 11: Civil Engineering Data Analytics).

I am programmed with civil engineering knowledge covering:
* **The UCI Concrete Compressive Strength Dataset** (1,030 experimental batches by Prof. I-Cheng Yeh)
* **Portland Cement Chemistry & Hydration Kinetics** ($C_3S$, $C_2S$, $C_3A$, $C_4AF$, C-S-H gel development)
* **Supplementary Cementitious Materials** (GGBFS slag and Fly Ash pozzolanic reactions)
* **Chemical Admixtures** (Polycarboxylate ethers, steric hindrance, water reduction)
* **Abrams' Law & Water-to-Binder Optimization**
* **Machine Learning Analytics** (Random Forest ensembles, bias-variance tradeoff, test set metrics)

How can I assist your concrete mix analysis or machine learning evaluation today?`,
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isLoading) return;

    setErrorMessage(null);
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            text: m.text,
          })),
          context: {
            modelMetrics: modelMetrics
              ? {
                  r2: modelMetrics.r2,
                  mae: modelMetrics.mae,
                  rmse: modelMetrics.rmse,
                }
              : null,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned status ${response.status}`);
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'model',
        text: data.reply || 'No response returned from model.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'Failed to connect to the assistant server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        timestamp: Date.now(),
        text: 'Chat history cleared. What topic or mix design question would you like to explore next?',
      },
    ]);
    setErrorMessage(null);
  };

  const quickPrompts = [
    {
      title: "Abrams' Law vs. Water",
      prompt: "Why does excess water sharply reduce concrete compressive strength, and how does Abrams' Law mathematically describe this?",
    },
    {
      title: 'Slag & Fly Ash Chemistry',
      prompt: 'Explain the difference between latent hydraulic reactions in Blast Furnace Slag and pozzolanic reactions in Fly Ash.',
    },
    {
      title: 'Polycarboxylate Admixtures',
      prompt: 'How do Polycarboxylate Ether (PCE) superplasticizers work on cement particles through steric hindrance, and why do they enable high strength?',
    },
    {
      title: 'Random Forest vs Linear ML',
      prompt: 'Why does Random Forest achieve R² > 0.91 on the UCI concrete dataset while multiple linear regression typically achieves only R² ~ 0.60?',
    },
    {
      title: 'Inverse Optimization Limits',
      prompt: 'What are the main engineering limitations of inverse concrete mix design, and why are ASTM C39 cylinder trial batches mandatory?',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Bot className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Civil Engineering AI Assistant
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Powered by Gemini 3.8 Flash • Specialized in concrete technology, hydration kinetics & ML regression
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* Quick Question Chips */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Suggested Civil Engineering Lab Questions:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qp.prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-colors disabled:opacity-50"
              >
                {qp.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm flex flex-col h-[560px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-amber-400 border border-slate-700'
                  }`}
                >
                  {isUser ? 'ME' : <HardHat className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-amber-500 text-slate-950 font-medium'
                      : 'bg-slate-800/80 text-slate-200 border border-slate-700/60 shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{m.text}</div>
                  <div
                    className={`text-[10px] mt-2 font-mono ${
                      isUser ? 'text-slate-800 text-right' : 'text-slate-400'
                    }`}
                  >
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-xl mr-auto">
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Engineering Assistant is calculating and synthesizing reply...</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about concrete mix design, hydration reactions, Abrams' Law, or Random Forest regression..."
              rows={1}
              className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none max-h-32"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold rounded-xl transition-colors shadow-sm shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-[10px] text-slate-500 mt-2 text-center">
            Concrete Strength AI Assistant • Prototyped for Exercise 11 • All structural designs require laboratory trial mixes per ASTM C192 / ASTM C39.
          </div>
        </div>
      </div>
    </div>
  );
};
