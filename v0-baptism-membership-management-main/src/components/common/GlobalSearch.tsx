import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Users, Church, MapPin, Landmark, Loader2 } from 'lucide-react';
import { searchService, SearchResult, SearchResponse } from '@/services/searchService';

export default function GlobalSearch() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allResults: SearchResult[] = results
    ? [
        ...results.candidates,
        ...results.users,
        ...results.churches,
        ...results.districts,
        ...results.fields,
      ]
    : [];

  const sectionedResults = results
    ? [
        { key: 'candidates', items: results.candidates, icon: Users },
        { key: 'users', items: results.users, icon: Users },
        { key: 'churches', items: results.churches, icon: Church },
        { key: 'districts', items: results.districts, icon: MapPin },
        { key: 'fields', items: results.fields, icon: Landmark },
      ].filter((s) => s.items.length > 0)
    : [];

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchService.globalSearch(query);
        setResults(data);
        setIsOpen(true);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < allResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : allResults.length - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0 && allResults[activeIndex]) {
        e.preventDefault();
        setIsOpen(false);
        setQuery('');
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    },
    [activeIndex, allResults]
  );

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-search-item]');
      items[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('search.placeholder')}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
        )}
      </div>

      {isOpen && (
        <div
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto"
        >
          {allResults.length === 0 && !loading ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {t('search.noResults')}
            </div>
          ) : (
            sectionedResults.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.key}>
                  <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50">
                    {t(`search.${section.key}`)}
                  </div>
                  {section.items.map((item) => {
                    const globalIndex = allResults.indexOf(item);
                    return (
                      <Link
                        key={`${section.key}-${item.id}`}
                        to={item.url}
                        data-search-item
                        onClick={() => {
                          setIsOpen(false);
                          setQuery('');
                        }}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          globalIndex === activeIndex
                            ? 'bg-primary/10 text-primary'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <Icon size={16} className="shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.subtitle}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
