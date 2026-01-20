
import React, { useEffect, useState, useCallback } from 'react';
import { getMarketTrends } from '../services/geminiService';
import { Trend } from '../types';
import { ASSET_CATEGORIES } from '../constants';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Loader } from './ui/Loader';

interface TrendDashboardProps {
  onUsePrompt: (prompt: string) => void;
  cachedTrends: Trend[];
  setCachedTrends: (trends: Trend[]) => void;
}

const TrendDashboard: React.FC<TrendDashboardProps> = ({ onUsePrompt, cachedTrends, setCachedTrends }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const fetchTrends = useCallback(async (force = false) => {
    if (!force && cachedTrends.length > 0) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getMarketTrends();
      if (data && data.length > 0) {
        setCachedTrends(data);
      } else {
        setError("No trend data available.");
      }
    } catch (err) {
      setError("Failed to fetch trends. Please ensure your API key is connected.");
    } finally {
      setLoading(false);
    }
  }, [cachedTrends.length, setCachedTrends]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const categories = [
    { id: 'all', label: 'All Trends' },
    ...ASSET_CATEGORIES
  ];

  const visibleTrends = activeCategory === 'all' 
    ? cachedTrends 
    : cachedTrends.filter(t => t.category === activeCategory);

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      <PageHeader 
        title="Market Intelligence" 
        description="High-demand niches identified by AI for maximum sales potential on Adobe Stock."
        action={
          <Button 
            variant="outline" 
            onClick={() => fetchTrends(true)} 
            disabled={loading}
            className="!p-2.5 rounded-xl border-slate-700 bg-slate-800"
          >
             <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
          </Button>
        }
      />

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-1 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-t-lg transition-all relative whitespace-nowrap ${
              activeCategory === cat.id 
                ? 'text-indigo-400 bg-slate-800/50 border-b-2 border-indigo-500' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && cachedTrends.length === 0 ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1,2,3,4,5,6].map(i => (
             <div key={i} className="h-64 bg-slate-800/30 rounded-2xl animate-pulse border border-slate-800"></div>
           ))}
         </div>
      ) : error && cachedTrends.length === 0 ? (
        <Card variant="flat" className="flex flex-col items-center justify-center h-64 border-red-500/10 bg-red-500/5 text-center p-6">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Analysis Failed</h3>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <Button variant="ghost" className="text-indigo-400" onClick={() => fetchTrends(true)}>Try Again</Button>
        </Card>
      ) : (
        <>
          {visibleTrends.length === 0 && (
             <div className="text-center py-12 text-slate-500">
               <p>No trends found for this category.</p>
             </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {visibleTrends.map((trend, idx) => (
              <Card 
                key={`${trend.topic}-${idx}`} 
                variant="hoverable"
                className="flex flex-col h-full overflow-hidden"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <div className="relative z-10 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant={trend.category as any}>{trend.category}</Badge>
                    <Badge variant={trend.commercialValue === 'High' ? 'success' : 'warning'}>
                      {trend.commercialValue} Value
                    </Badge>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                    {trend.topic}
                  </h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    {trend.description}
                  </p>

                  <div className="space-y-3 mt-auto">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Suggested Concepts</p>
                    {trend.suggestedPrompts.slice(0, 2).map((prompt, pIdx) => (
                      <Button
                        key={pIdx}
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={() => onUsePrompt(prompt)}
                        className="!justify-between !text-slate-300 !border-slate-700/50 hover:!border-indigo-500 hover:!text-white group/btn"
                        rightIcon={
                          <svg className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-all -translate-x-2 group-hover/btn:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        }
                      >
                         <span className="truncate text-left flex-1">{prompt}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TrendDashboard;
