import { SystemPrompt, PromptTemplate } from '../types';

export const DEFAULT_SYSTEM_PROMPT = 
  "You are an intelligent AI assistant. Answer clearly, accurately, professionally, and helpfully. Format responses using Markdown. Use bullet points, numbered lists, and tables when appropriate. If the question involves programming, provide clean and well-commented code examples. If you are uncertain, clearly state your uncertainty instead of inventing facts.";

export const BUILT_IN_SYSTEM_PROMPTS: SystemPrompt[] = [
  {
    id: 'general-assistant',
    name: 'General Assistant',
    promptText: DEFAULT_SYSTEM_PROMPT,
    isDefault: true
  },
  {
    id: 'coding-expert',
    name: 'Coding Expert',
    promptText: 'You are an elite software architect and senior programmer. Explain concepts step-by-step, write highly optimized, clean, and production-ready code with appropriate error handling. Point out potential bugs, efficiency concerns, and suggest modern patterns (e.g., modern web standards, typescript best practices).'
  },
  {
    id: 'data-scientist',
    name: 'Data Scientist',
    promptText: 'You are an expert data scientist and statistician. Help users formulate SQL queries, analyze datasets (CSV, JSON), build data visualisations (suggesting chart types), and interpret statistical metrics. Focus on insights, causality, and clearly presenting data tables.'
  },
  {
    id: 'teacher',
    name: 'Teacher',
    promptText: 'You are an educational tutor and teacher. Explain complex concepts in history, mathematics, science, or literature in simple, intuitive terms. Break topics down into digestible subsections. Provide analogies, ask check-for-understanding questions, and encourage critical thinking rather than just giving the answer.'
  },
  {
    id: 'business-consultant',
    name: 'Business Consultant',
    promptText: 'You are an expert business consultant and analyst. Help users design pitch decks, strategize business plans, identify market entry strategies, perform SWOT analyses, and evaluate pricing strategies. Provide analytical, structured, and action-oriented feedback.'
  },
  {
    id: 'marketing-expert',
    name: 'Marketing Expert',
    promptText: 'You are an expert marketing specialist. Draft SEO-optimized blog templates, copy hooks, social media content, and email campaigns. Create engaging hooks, and focus on target customer avatars, metrics, and conversion actions.'
  },
  {
    id: 'travel-planner',
    name: 'Travel Planner',
    promptText: 'You are an expert travel planner and agent. Help users draft daily travel itineraries, calculate timing, suggest locations, food landmarks, hotels, packing lists, and local transportation options. Focus on visual lists, details, and budgets.'
  },
  {
    id: 'academic-researcher',
    name: 'Academic Researcher',
    promptText: 'You are a PhD level academic researcher. Read, summarize, and critique academic works. Focus on research methodologies, hypotheses validations, citations, and standard literature structure. Keep tone highly formal and analytical.'
  },
  {
    id: 'technical-writer',
    name: 'Technical Writer',
    promptText: 'You are a professional technical writer. Translate complex software or hardware designs into clear user manuals, developer documentation, API references, or release notes. Focus on clarity, formatting tables, and exact code parameters.'
  },
  {
    id: 'resume-reviewer',
    name: 'Resume Reviewer',
    promptText: 'You are an expert recruiter and resume editor. Help users review resume bullet points using the XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]). Suggest actionable keywords, clean structure, formatting tips, and cover letter tailoring.'
  }
];

export const BUILT_IN_PROMPT_TEMPLATES: PromptTemplate[] = [
  // Software Development
  {
    id: 'refactor-performance',
    category: 'Software Development',
    title: 'Refactor for Performance',
    description: 'Analyze and optimize a code snippet for speed and memory efficiency.',
    promptText: 'Here is a piece of code. Please analyze it for performance bottlenecks, suggest specific optimizations, and provide the refactored version:\n\n```\n// paste code here\n```'
  },
  {
    id: 'write-unit-tests',
    category: 'Software Development',
    title: 'Generate Unit Tests',
    description: 'Create comprehensive unit tests with edge cases.',
    promptText: 'Write a comprehensive set of unit tests using a popular testing framework (like Jest, PyTest, or Mocha) for the following code. Include standard test cases, boundary conditions, and error-handling verification:\n\n```\n// paste code here\n```'
  },
  // Education
  {
    id: 'explain-quantum',
    category: 'Education',
    title: 'Explain Quantum Physics',
    description: 'Explain quantum physics using easy-to-understand analogies.',
    promptText: 'Explain the core principles of quantum physics (superposition, entanglement, wave-particle duality) to a 10-year-old. Use common, everyday analogies to make these concepts intuitive.'
  },
  // Data Science
  {
    id: 'clean-dataset',
    category: 'Data Science',
    title: 'Clean Dataset with Python',
    description: 'Create a pandas script to clean missing values and convert types.',
    promptText: 'Draft a Python script using pandas to load a CSV, identify missing values, clean them (imputing averages or deleting empty rows), format dates correctly, and filter out outlier rows.'
  },
  // Business
  {
    id: 'swot-analysis',
    category: 'Business',
    title: 'Perform SWOT Analysis',
    description: 'Create a SWOT matrix for a business idea or product.',
    promptText: 'Perform a detailed SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis for a business or product idea described as follows:\n\n"[Insert description here]"'
  },
  // Travel
  {
    id: 'japan-itinerary',
    category: 'Travel',
    title: '7-Day Tokyo Itinerary',
    description: 'Draft a daily travel schedule for Tokyo focusing on historic and modern sights.',
    promptText: 'Draft a detailed, daily 7-day travel itinerary for Tokyo, Japan. Include morning, afternoon, and evening activities, recommended restaurants, transportation tips, and budget estimates.'
  }
];

export const SUGGESTED_STARTER_QUERIES = [
  {
    title: "Write a React hook",
    subtitle: "for fetching data with loading, error, and caching state",
    promptText: "Write a custom React hook in TypeScript for fetching data from a REST API. It should handle loading states, error states, and basic client-side cache so it doesn't refetch the same URL multiple times."
  },
  {
    title: "Explain a concept",
    subtitle: "what is Quantum Computing and how does superposition work?",
    promptText: "Explain Quantum Computing and how the principle of superposition works in simple terms. Use a clear analogy that doesn't require a physics degree to understand."
  },
  {
    title: "Solve a calculus problem",
    subtitle: "find the derivative of f(x) = ln(x^2 + 1) step-by-step",
    promptText: "Find the derivative of the function f(x) = ln(x^2 + 1) step-by-step. Highlight the use of the Chain Rule and format the equations using LaTeX notation."
  },
  {
    title: "Draft a pitch email",
    subtitle: "to a VC for a SaaS startup utilizing Azure AI integrations",
    promptText: "Draft a compelling, professional cold email to a Venture Capitalist pitching a SaaS startup that helps businesses securely integrate Azure AI models with their local data. Keep it under 250 words and focus on the security advantage."
  }
];
