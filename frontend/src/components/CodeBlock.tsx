'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  value: string;
}

export default function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Generate numbered list lines to display line numbers
  const lines = value.split('\n');

  return (
    <div className="relative rounded-xl border border-border bg-slate-950 dark:bg-zinc-950 overflow-hidden my-4 group shadow-md print:bg-white print:text-black print:border">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-slate-900/50 dark:bg-zinc-900/50 print:bg-slate-100 print:text-black">
        <span className="text-xs font-mono text-zinc-400 font-medium lowercase print:text-black">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-zinc-400 hover:text-foreground hover:bg-muted transition-all active:scale-95 print:hidden"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      
      {/* Code panel with line numbers */}
      <div className="flex overflow-x-auto p-4 font-mono text-sm leading-relaxed text-zinc-100 selection:bg-indigo-500/30 print:text-black">
        {/* Line Numbers column */}
        <div className="select-none text-right text-zinc-600 dark:text-zinc-500 pr-4 border-r border-border/40 shrink-0 text-xs text-right w-8 print:text-zinc-400">
          {lines.map((_, idx) => (
            <div key={idx} className="h-6 leading-6">{idx + 1}</div>
          ))}
        </div>

        {/* Code Content column */}
        <pre className="!bg-transparent !p-0 !m-0 flex-1 pl-4">
          <code className="block select-text whitespace-pre text-xs leading-6">{value}</code>
        </pre>
      </div>
    </div>
  );
}
