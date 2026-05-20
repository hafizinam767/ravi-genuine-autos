'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Sparkles, X, Loader2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';

const POPULAR_SEARCHES = [
  'WagonR engine parts',
  'Alto brake pads',
  'Civic headlight',
];

interface AISuggestion {
  partName: string | null;
  carMake: string | null;
  carModel: string | null;
  condition: string | null;
  category: string | null;
  keywords: string[];
}

export default function SearchBar() {
  const { filters, setFilters, setView } = useAppStore();
  const [query, setQuery] = useState(filters.search || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [showAIBadge, setShowAIBadge] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with store
  useEffect(() => {
    setQuery(filters.search || '');
  }, [filters.search]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
        setShowAIBadge(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced input (300ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Could trigger autocomplete or suggestion fetch here
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const performSearch = useCallback(
    async (searchQuery?: string) => {
      const q = searchQuery || query;
      if (!q.trim()) return;

      // 1. Immediately update store and navigate to catalog
      setFilters({ search: q.trim() });
      setView('catalog');
      setShowSuggestions(false);

      // 2. Send to AI for enhanced analysis
      setIsAILoading(true);
      setAiSuggestion(null);
      setShowAIBadge(false);

      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q.trim() }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.aiAnalysis && data.aiAnalysis.partName) {
            setAiSuggestion(data.aiAnalysis);
            setShowAIBadge(true);
          }
        }
      } catch {
        // Silently fail — local search still works
      } finally {
        setIsAILoading(false);
      }
    },
    [query, setFilters, setView]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch();
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setQuery('');
    setFilters({ search: '' });
    setAiSuggestion(null);
    setShowAIBadge(false);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  const applyAISuggestion = () => {
    if (!aiSuggestion) return;
    const filtersUpdate: Record<string, string> = {};
    if (aiSuggestion.condition && aiSuggestion.condition !== 'all') {
      filtersUpdate.condition = aiSuggestion.condition;
    }
    if (aiSuggestion.keywords?.length) {
      filtersUpdate.search = aiSuggestion.keywords.join(' ');
      setQuery(aiSuggestion.keywords.join(' '));
    }
    setFilters(filtersUpdate);
    setView('catalog');
    setShowAIBadge(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (!query.trim()) setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search parts... (AI-powered)"
          className="w-full rounded-xl border-border bg-background pl-10 pr-20 py-2.5 text-sm shadow-sm focus-visible:ring-amber-500"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {isAILoading && (
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
          )}
          {query && !isAILoading && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            onClick={() => performSearch()}
            disabled={!query.trim() || isAILoading}
            size="sm"
            className="h-7 gap-1 rounded-lg bg-amber-500 px-2.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
          >
            <Sparkles className="h-3 w-3" />
            <span className="hidden sm:inline">Search</span>
          </Button>
        </div>
      </div>

      {/* Popular Searches Dropdown */}
      <AnimatePresence>
        {showSuggestions && !query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 z-40 mt-1.5 w-full rounded-xl border border-border bg-background shadow-lg"
          >
            <div className="px-3 pt-3 pb-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Popular Searches
              </p>
            </div>
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => handleSuggestionClick(term)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
              >
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                {term}
              </button>
            ))}
            <div className="border-t px-3 py-2">
              <button
                onClick={() => {
                  setView('identify');
                  setShowSuggestions(false);
                }}
                className="flex w-full items-center gap-2 text-sm text-amber-600 hover:text-amber-700"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Identify a part by image
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Suggestion Badge */}
      <AnimatePresence>
        {showAIBadge && aiSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 z-40 mt-1.5 w-full overflow-hidden"
          >
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3 shadow-lg">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                    AI Suggestion
                  </p>
                  <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                    {aiSuggestion.partName && (
                      <span>
                        Part: <strong>{aiSuggestion.partName}</strong>
                      </span>
                    )}
                    {aiSuggestion.category && (
                      <Badge
                        variant="secondary"
                        className="ml-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-[10px] px-1.5 py-0"
                      >
                        {aiSuggestion.category}
                      </Badge>
                    )}
                  </p>
                  {(aiSuggestion.carMake || aiSuggestion.carModel) && (
                    <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                      Vehicle:{' '}
                      {[aiSuggestion.carMake, aiSuggestion.carModel]
                        .filter(Boolean)
                        .join(' ')}
                    </p>
                  )}
                  {aiSuggestion.condition && (
                    <Badge
                      variant="outline"
                      className="mt-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400 text-[10px]"
                    >
                      {aiSuggestion.condition}
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  className="h-7 gap-1 rounded-lg bg-amber-500 px-2.5 text-xs font-medium text-white hover:bg-amber-600"
                  onClick={applyAISuggestion}
                >
                  Apply
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
