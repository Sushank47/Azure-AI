'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import CodeBlock from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose dark:prose-invert max-w-none text-foreground selection:bg-indigo-500/20">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 hover:text-indigo-400 underline decoration-indigo-500/30 hover:decoration-indigo-500/70 transition-all font-medium"
              >
                {children}
              </a>
            );
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const inline = !className;

            if (inline) {
              return (
                <code 
                  className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-indigo-400 dark:text-indigo-300 font-semibold"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            return <CodeBlock language={language} value={codeString} />;
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-xl border border-border shadow-sm">
                <table className="min-w-full divide-y divide-border text-sm">
                  {children}
                </table>
              </div>
            );
          },
          h1: ({ children }) => <h1 className="text-xl md:text-2xl font-bold tracking-tight mt-6 mb-3 bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent light:from-zinc-900 light:to-zinc-700">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg md:text-xl font-semibold tracking-tight mt-5 mb-2 border-b border-border/40 pb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base md:text-lg font-medium tracking-tight mt-4 mb-1.5">{children}</h3>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
