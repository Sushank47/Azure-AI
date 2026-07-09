'use client';

import React, { useState } from 'react';
import { 
  User, 
  Cpu, 
  Copy, 
  Check, 
  Edit2, 
  RotateCw,
  X,
  CheckSquare
} from 'lucide-react';
import { Message } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatBubbleProps {
  message: Message;
  onEdit: (id: string, newContent: string) => void;
  onRegenerate?: () => void;
  isGenerating?: boolean;
  isLastAssistantMessage?: boolean;
}

export default function ChatBubble({ 
  message, 
  onEdit, 
  onRegenerate, 
  isGenerating = false,
  isLastAssistantMessage = false 
}: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState(message.content);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleSaveEdit = () => {
    if (editVal.trim() && editVal !== message.content) {
      onEdit(message.id, editVal.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className={`
      group w-full flex gap-4 p-6 rounded-2xl border transition-all duration-200 hover:shadow-sm
      ${isUser 
        ? 'bg-muted/20 border-border/30 dark:bg-zinc-900/10' 
        : 'bg-card/40 border-border/40 backdrop-blur-sm'
      }
    `}>
      <div className={`
        h-9 w-9 rounded-xl shrink-0 flex items-center justify-center border shadow-sm
        ${isUser 
          ? 'bg-secondary border-border text-muted-foreground' 
          : 'bg-gradient-to-tr from-indigo-500 to-purple-600 border-indigo-500/20 text-white'
        }
      `}>
        {isUser ? <User className="h-4.5 w-4.5" /> : <Cpu className="h-4.5 w-4.5" />}
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-2xs text-muted-foreground/60 font-mono">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              className="w-full min-h-[100px] p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm font-sans"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg active:scale-95 transition-all shadow-sm shadow-indigo-500/15"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Save changes
              </button>
              <button
                onClick={() => {
                  setEditVal(message.content);
                  setIsEditing(false);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium rounded-lg active:scale-95 transition-all"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm leading-relaxed overflow-hidden">
            {isUser ? (
              <p className="whitespace-pre-wrap font-sans text-foreground">{message.content}</p>
            ) : (
              <MarkdownRenderer content={message.content} />
            )}
          </div>
        )}

        {!isEditing && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-95 border border-border/20"
              title="Copy message text"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {isUser ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-95 border border-border/20"
                title="Edit message"
              >
                <Edit2 className="h-3 w-3" />
                <span>Edit</span>
              </button>
            ) : (
              isLastAssistantMessage && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none border border-border/20"
                  title="Regenerate response"
                >
                  <RotateCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
