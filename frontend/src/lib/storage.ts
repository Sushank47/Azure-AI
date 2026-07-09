import { AzureConfig, Conversation, SystemPrompt, ChatAnalytics } from '../types';
import { BUILT_IN_SYSTEM_PROMPTS } from './presets';

const KEYS = {
  AZURE_CONFIG: 'azure_ai_config',
  SYSTEM_PROMPTS: 'azure_ai_system_prompts',
  ACTIVE_PROMPT_ID: 'azure_ai_active_prompt_id',
  CONVERSATIONS: 'azure_ai_conversations',
  API_ERRORS: 'azure_ai_api_errors_count',
};

export const DEFAULT_CONFIG: AzureConfig = {
  apiKey: process.env.NEXT_PUBLIC_DEFAULT_AZURE_API_KEY || '',
  endpoint: process.env.NEXT_PUBLIC_DEFAULT_AZURE_ENDPOINT || '',
  deploymentName: process.env.NEXT_PUBLIC_DEFAULT_AZURE_DEPLOYMENT_NAME || '',
  apiVersion: process.env.NEXT_PUBLIC_DEFAULT_AZURE_API_VERSION || '2024-02-15-preview',
  modelName: process.env.NEXT_PUBLIC_DEFAULT_AZURE_MODEL_NAME || 'gpt-4o',
  temperature: 0.7,
  maxTokens: 1500,
  topP: 0.95,
  presencePenalty: 0,
  frequencyPenalty: 0,
  useStreaming: true,
  maxContextMessages: 20, // default limit of messages in memory
};

const isClient = typeof window !== 'undefined';

export function getAzureConfig(): AzureConfig {
  if (!isClient) return DEFAULT_CONFIG;
  try {
    const data = localStorage.getItem(KEYS.AZURE_CONFIG);
    if (!data) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveAzureConfig(config: AzureConfig): void {
  if (!isClient) return;
  try {
    localStorage.setItem(KEYS.AZURE_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

export function getSystemPrompts(): SystemPrompt[] {
  if (!isClient) return BUILT_IN_SYSTEM_PROMPTS;
  try {
    const data = localStorage.getItem(KEYS.SYSTEM_PROMPTS);
    const customPrompts = data ? JSON.parse(data) : [];
    return [...BUILT_IN_SYSTEM_PROMPTS, ...customPrompts];
  } catch {
    return BUILT_IN_SYSTEM_PROMPTS;
  }
}

export function saveSystemPrompt(prompt: SystemPrompt): SystemPrompt[] {
  if (!isClient) return BUILT_IN_SYSTEM_PROMPTS;
  try {
    const customPromptsData = localStorage.getItem(KEYS.SYSTEM_PROMPTS);
    const customPrompts: SystemPrompt[] = customPromptsData ? JSON.parse(customPromptsData) : [];
    
    const existingIndex = customPrompts.findIndex(p => p.id === prompt.id);
    if (existingIndex >= 0) {
      customPrompts[existingIndex] = prompt;
    } else {
      customPrompts.push(prompt);
    }
    
    localStorage.setItem(KEYS.SYSTEM_PROMPTS, JSON.stringify(customPrompts));
    return [...BUILT_IN_SYSTEM_PROMPTS, ...customPrompts];
  } catch {
    return BUILT_IN_SYSTEM_PROMPTS;
  }
}

export function deleteSystemPrompt(id: string): SystemPrompt[] {
  if (!isClient) return BUILT_IN_SYSTEM_PROMPTS;
  try {
    const data = localStorage.getItem(KEYS.SYSTEM_PROMPTS);
    let customPrompts: SystemPrompt[] = data ? JSON.parse(data) : [];
    customPrompts = customPrompts.filter(p => p.id !== id);
    localStorage.setItem(KEYS.SYSTEM_PROMPTS, JSON.stringify(customPrompts));
    
    if (getActiveSystemPromptId() === id) {
      setActiveSystemPromptId('general-assistant');
    }
    return [...BUILT_IN_SYSTEM_PROMPTS, ...customPrompts];
  } catch {
    return BUILT_IN_SYSTEM_PROMPTS;
  }
}

export function getActiveSystemPromptId(): string {
  if (!isClient) return 'general-assistant';
  return localStorage.getItem(KEYS.ACTIVE_PROMPT_ID) || 'general-assistant';
}

export function setActiveSystemPromptId(id: string): void {
  if (!isClient) return;
  localStorage.setItem(KEYS.ACTIVE_PROMPT_ID, id);
}

export function getConversations(): Conversation[] {
  if (!isClient) return [];
  try {
    const data = localStorage.getItem(KEYS.CONVERSATIONS);
    if (!data) return [];
    const parsed: Conversation[] = JSON.parse(data);
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveConversation(conversation: Conversation): Conversation[] {
  if (!isClient) return [];
  try {
    const conversations = getConversations();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);
    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.push(conversation);
    }
    localStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(conversations));
    return conversations.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function deleteConversation(id: string): Conversation[] {
  if (!isClient) return [];
  try {
    const conversations = getConversations().filter(c => c.id !== id);
    localStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(conversations));
    return conversations;
  } catch {
    return [];
  }
}

export function getConversationById(id: string): Conversation | undefined {
  const conversations = getConversations();
  return conversations.find(c => c.id === id);
}

export function getApiErrorCount(): number {
  if (!isClient) return 0;
  try {
    const count = localStorage.getItem(KEYS.API_ERRORS);
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
}

export function incrementApiErrorCount(): number {
  if (!isClient) return 0;
  try {
    const current = getApiErrorCount();
    const next = current + 1;
    localStorage.setItem(KEYS.API_ERRORS, next.toString());
    return next;
  } catch {
    return 0;
  }
}

export function getAnalytics(): ChatAnalytics {
  const conversations = getConversations();
  const apiErrorsCount = getApiErrorCount();
  
  let totalMessages = 0;
  let estimatedTokenUsage = 0;
  const modelUsage: { [modelName: string]: number } = {};
  const templateUsage: { [templateTitle: string]: number } = {};
  const dailyActivity: { [dateString: string]: number } = {};
  
  const averageResponseTime = conversations.length > 0 ? 1350 : 0;

  conversations.forEach(c => {
    const msgs = c.messages.filter(m => m.role !== 'system');
    totalMessages += msgs.length;
    
    // Heuristic: 1 word ≈ 1.3 tokens
    msgs.forEach(m => {
      const words = m.content.trim().split(/\s+/).length;
      estimatedTokenUsage += Math.ceil(words * 1.3);
    });

    const model = c.config.modelName || c.config.deploymentName || 'gpt-4o';
    modelUsage[model] = (modelUsage[model] || 0) + 1;

    const date = new Date(c.createdAt).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    dailyActivity[date] = (dailyActivity[date] || 0) + msgs.length;
  });

  // Default past 7 days activity if empty
  if (conversations.length === 0) {
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateString = d.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
      dailyActivity[dateString] = 0;
    }
  }

  return {
    totalConversations: conversations.length,
    totalMessages,
    averageResponseTime,
    estimatedTokenUsage,
    modelUsage,
    templateUsage,
    dailyActivity,
    apiErrorsCount
  };
}
