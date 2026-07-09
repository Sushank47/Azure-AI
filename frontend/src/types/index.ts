export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AzureConfig {
  apiKey: string;
  endpoint: string;
  deploymentName: string;
  apiVersion: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  presencePenalty: number;
  frequencyPenalty: number;
  useStreaming: boolean;
  maxContextMessages: number; // Trimming limit for messages
}

export interface SystemPrompt {
  id: string;
  name: string;
  promptText: string;
  isDefault?: boolean;
  isCustom?: boolean;
}

export interface PromptTemplate {
  id: string;
  category: string;
  title: string;
  description: string;
  promptText: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  systemPromptId: string; // references SystemPrompt.id
  config: AzureConfig;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ChatAnalytics {
  totalConversations: number;
  totalMessages: number;
  averageResponseTime: number; // in milliseconds
  estimatedTokenUsage: number;
  modelUsage: { [modelName: string]: number };
  templateUsage: { [templateTitle: string]: number };
  dailyActivity: { [dateString: string]: number }; // e.g. "07/09": 15
  apiErrorsCount: number; // API error tracking
}
