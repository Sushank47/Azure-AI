'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { 
  Send, 
  StopCircle, 
  Sparkles,
  Loader2,
  Search,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getAzureConfig, 
  incrementApiErrorCount
} from '../lib/storage';
import { Message, AzureConfig } from '../types';
import { SUGGESTED_STARTER_QUERIES } from '../lib/presets';
import ChatBubble from '../components/ChatBubble';

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    }>
      <SearchBotPage />
    </Suspense>
  );
}

function SearchBotPage() {
  const [config, setConfig] = useState<AzureConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const loadedConfig = getAzureConfig();
    setConfig(loadedConfig);
    setLoadingConfig(false);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, generating]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || generating || !config) return;

    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    executeStream(updatedMessages);
  };

  const executeStream = async (chatHistory: Message[]) => {
    if (!config) return;
    setGenerating(true);

    abortControllerRef.current = new AbortController();

    const assistantMessageId = crypto.randomUUID();
    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, assistantPlaceholder]);

    const systemMessage = {
      role: 'system',
      content: 'You are a helpful and precise assistant. Answer questions clearly and concisely.'
    };

    const maxHist = config.maxContextMessages || 20;
    const trimmedHistory = chatHistory.slice(-maxHist).map(m => ({
      role: m.role,
      content: m.content
    }));

    const requestMessages = [systemMessage, ...trimmedHistory];

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: config.apiKey,
          endpoint: config.endpoint,
          deploymentName: config.deploymentName,
          apiVersion: config.apiVersion,
          messages: requestMessages,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          topP: config.topP,
          presencePenalty: config.presencePenalty,
          frequencyPenalty: config.frequencyPenalty,
          useStreaming: config.useStreaming
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to communicate with Azure OpenAI.');
      }

      if (!config.useStreaming) {
        const data = await response.json();
        const finalContent = data.choices?.[0]?.message?.content || '';
        
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId ? { ...m, content: finalContent, timestamp: Date.now() } : m
        ));
      } else {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        let partialLine = '';

        if (!reader) throw new Error('Response body reader is not available.');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = (partialLine + chunk).split('\n');
          partialLine = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            if (trimmedLine.startsWith('data: ')) {
              const dataStr = trimmedLine.slice(6).trim();
              if (dataStr === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(dataStr);
                const text = parsed.choices?.[0]?.delta?.content || '';
                if (text) {
                  assistantContent += text;
                  setMessages(prev => prev.map(m => 
                    m.id === assistantMessageId ? { ...m, content: assistantContent } : m
                  ));
                }
              } catch (e) {
                // Ignore partial JSON
              }
            }
          }
        }

        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId ? { ...m, content: assistantContent, timestamp: Date.now() } : m
        ));
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
      } else {
        const errorMessage = err.message || 'An error occurred during generating completion.';
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId 
            ? { ...m, content: `Error: ${errorMessage}. Please check your Azure credentials inside the root .env configuration file.` } 
            : m
        ));
        incrementApiErrorCount();
      }
    } finally {
      setGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setGenerating(false);
    }
  };

  const handleRegenerate = async (messageIndex: number) => {
    if (generating) return;
    const historyToRegen = messages.slice(0, messageIndex);
    setMessages(historyToRegen);
    executeStream(historyToRegen);
  };

  const handleEditMessage = (index: number, newContent: string) => {
    const updated = [...messages];
    updated[index].content = newContent;
    const truncatedHistory = updated.slice(0, index + 1);
    setMessages(truncatedHistory);
    executeStream(truncatedHistory);
  };

  if (loadingConfig) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const isSearchState = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col bg-background min-h-[calc(100vh-65px)] relative overflow-hidden">
      
      {/* Aurora Ambient Glowing Backdrops (CSS animated floating circles) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-45 dark:opacity-60">
        {/* Floating Circle 1 */}
        <div 
          className="absolute -top-[10%] left-[20%] w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-600/10 blur-[100px]"
          style={{
            animation: 'float-circle-one 20s ease-in-out infinite'
          }}
        />
        {/* Floating Circle 2 */}
        <div 
          className="absolute top-[40%] -right-[5%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-pink-500/10 to-indigo-600/20 blur-[120px]"
          style={{
            animation: 'float-circle-two 25s ease-in-out infinite'
          }}
        />
        {/* Glowing Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)]" />
      </div>

      {/* Styled animation keyframes inside style tag */}
      <style jsx global>{`
        @keyframes float-circle-one {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, -60px) scale(1.1); }
        }
        @keyframes float-circle-two {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-50px, 40px) scale(0.95); }
        }
      `}</style>

      {/* Main Wrapper */}
      <div className="relative z-10 flex-1 flex flex-col w-full">
        <AnimatePresence mode="wait">
          {isSearchState ? (
            /* Futuristic Search Welcome View */
            <motion.div 
              key="search-mode"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              transition={{ type: 'spring', stiffness: 180, damping: 22 }}
              className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-3xl mx-auto w-full"
            >
              {/* Glowing Icon Brand Badge */}
              <motion.div 
                initial={{ rotate: -15, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', delay: 0.1, stiffness: 200, damping: 15 }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Sparkles className="h-6 w-6 text-white animate-pulse" />
                </div>
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 via-indigo-200 to-purple-400 bg-clip-text text-transparent light:from-zinc-900 light:to-zinc-600 text-center mb-3"
              >
                Azure AI
              </motion.h2>

              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-muted-foreground text-center mb-8 max-w-md"
              >
                Ask anything from SQuAD files, python programming, or general knowledge topics.
              </motion.p>

              {/* Glassmorphic Search Bar */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, type: 'spring', stiffness: 180, damping: 20 }}
                className="w-full relative bg-card/45 backdrop-blur-xl border border-border/80 rounded-2xl p-3.5 shadow-xl flex items-center gap-3 mb-10 focus-within:ring-2 focus-within:ring-indigo-500/35 focus-within:border-indigo-500/30 transition-all duration-300"
              >
                <Search className="h-5.5 w-5.5 text-muted-foreground ml-2 shrink-0" />
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  className="flex-1 resize-none bg-transparent py-2 focus:outline-none text-sm leading-relaxed max-h-40 overflow-y-auto"
                  style={{ height: 'auto' }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || generating}
                  className="h-10 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs flex items-center gap-1.5 disabled:opacity-40 transition-all shadow-md active:scale-95 shrink-0"
                >
                  Ask
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </motion.div>

              {/* Suggestions Panel */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="w-full"
              >
                <div className="flex items-center gap-2 mb-4 justify-center sm:justify-start">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-widest">Suggested Queries</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUGGESTED_STARTER_QUERIES.slice(0, 4).map((query, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.015, y: -2 }}
                      whileTap={{ scale: 0.995 }}
                      onClick={() => handleSend(query.promptText)}
                      className="bg-card/30 backdrop-blur-sm border border-border/50 hover:bg-card/60 hover:border-indigo-500/30 rounded-xl p-4 text-left text-xs text-muted-foreground hover:text-foreground transition-all duration-200 group shadow-sm hover:shadow-indigo-500/5"
                    >
                      <span className="font-semibold text-indigo-400 block mb-0.5 group-hover:text-indigo-300 transition-colors">
                        {query.title}
                      </span>
                      {query.subtitle}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            /* Chat Mode View with active bubbles sliding in */
            <motion.div 
              key="chat-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-6 pt-8 pb-32"
            >
              <div className="space-y-6">
                {messages.map((message, index) => {
                  if (message.role === 'system') return null;
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 12, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                    >
                      <ChatBubble
                        message={message}
                        onRegenerate={() => handleRegenerate(index)}
                        onEdit={(_, content) => handleEditMessage(index, content)}
                        isGenerating={generating && index === messages.length - 1}
                        isLastAssistantMessage={index === messages.length - 1 && message.role === 'assistant'}
                      />
                    </motion.div>
                  );
                })}
              </div>

              <div ref={chatEndRef} />

              {/* Glowing Fixed Bottom Input Bar */}
              <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-30">
                <div className="max-w-4xl mx-auto w-full pointer-events-auto">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                    className="relative bg-card/45 backdrop-blur-xl border border-border/80 rounded-2xl p-2.5 shadow-xl flex items-center gap-2 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all"
                  >
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask a follow-up question..."
                      className="flex-1 resize-none bg-transparent py-2.5 px-3 focus:outline-none text-sm leading-relaxed max-h-40 overflow-y-auto"
                      style={{ height: 'auto' }}
                    />
                    
                    {generating ? (
                      <button
                        onClick={handleStopGeneration}
                        className="h-10 px-4 rounded-xl bg-destructive/15 border border-destructive/20 text-destructive-foreground hover:bg-destructive/25 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-95 shrink-0"
                      >
                        <StopCircle className="h-4.5 w-4.5" />
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSend()}
                        disabled={!input.trim()}
                        className="h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center disabled:opacity-40 transition-all shadow-md active:scale-95 shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
