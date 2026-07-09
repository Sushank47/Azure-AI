'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Moon, 
  Sun, 
  Plus,
  Search
} from 'lucide-react';

interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('azure_ai_theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('azure_ai_theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  const handleResetSearch = () => {
    // Navigate to root and trigger a page reload/reset state
    window.location.href = '/';
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
        
        {/* Simplified Premium Top Header */}
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div 
            onClick={handleResetSearch} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/10 group-hover:scale-105 transition-transform">
              <Search className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-semibold text-base bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent light:from-zinc-900 light:to-zinc-600 tracking-tight">
              Azure AI
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetSearch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold tracking-wide transition-all duration-200 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              New Search
            </button>
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
          </div>
        </header>

        {/* Content area: takes up full width without sidebar offsets */}
        <main className="flex-1 flex flex-col relative w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </ThemeContext.Provider>
  );
}
