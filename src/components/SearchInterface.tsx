import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowLeft, Loader2, Info, AlertCircle } from 'lucide-react';
import { ResultsDisplay } from './ResultsDisplay';
import type { SearchEngine, SearchResponse } from '../types/search';

interface SearchInterfaceProps {
  onNavigate: (page: string) => void;
}

const SEARCH_API_URL =
  import.meta.env.VITE_SEARCH_API_URL ||
  'https://us-central1-protean-silicon-300311.cloudfunctions.net/fakeIrSearch';

export function SearchInterface({ onNavigate }: SearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<SearchEngine>('auto');
  const [topK, setTopK] = useState(10);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseResponse = (text: string) => {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(false);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(SEARCH_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          k: topK,
          engine: selectedAlgorithm,
        }),
      });

      const raw = await response.text();
      const data = parseResponse(raw);

      if (!response.ok) {
        const message =
          (data as { error?: string })?.error ||
          response.statusText ||
          'Search request failed';
        throw new Error(message);
      }

      if (
        !data ||
        typeof data !== 'object' ||
        !('items' in data) ||
        !Array.isArray((data as { items?: unknown }).items)
      ) {
        throw new Error('Malformed response from search API');
      }

      setResults(data as SearchResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  const algorithms: { id: SearchEngine; name: string; description: string }[] = [
    { id: 'auto', name: 'Auto Select', description: 'Let backend choose the best engine' },
    { id: 'bm25', name: 'BM25', description: 'Probabilistic ranking function' },
    { id: 'dense', name: 'Dense Retrieval', description: 'Neural semantic search' },
    { id: 'hyde', name: 'HyDE', description: 'Hypothetical document embeddings' },
    { id: 'fusion', name: 'Fusion (RRF)', description: 'Reciprocal rank fusion' },
    { id: 'ltr', name: 'Learning to Rank', description: 'Phase-3 selector' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-neutral-900/50 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => onNavigate('landing')}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white">Search Interface</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Ask something... e.g., Who played Tony Stark?"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#500000] transition-colors"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
                className="px-8 py-4 bg-[#500000] text-white rounded-xl hover:bg-[#600000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search
                  </>
                )}
              </button>
            </div>

            {/* Algorithm Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-neutral-400">
                <span>Select Algorithm:</span>
                <Info className="w-4 h-4 cursor-help" title="Auto uses the backend selector; pick a specific engine to force a strategy." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {algorithms.map((algo) => (
                  <button
                    key={algo.id}
                    onClick={() => setSelectedAlgorithm(algo.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedAlgorithm === algo.id
                        ? 'bg-[#500000] border-[#500000] text-white'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-neutral-600'
                    }`}
                  >
                    <div className="mb-1">{algo.name}</div>
                    <p className="text-neutral-400">{algo.description}</p>
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-neutral-400">
                  <span>Results to return (k):</span>
                  <Info className="w-4 h-4 cursor-help" title="Backend accepts k between 1-20. Defaults to 10." />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value))}
                    className="w-full md:w-64 accent-[#500000]"
                  />
                  <div className="w-10 text-center text-white font-semibold">{topK}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 bg-[#2f1313] border border-[#500000]/60 rounded-xl p-4 text-red-100 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-300 mt-1" />
            <div>
              <p className="text-white font-semibold">Search failed</p>
              <p className="text-red-100/80 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Animation */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-neutral-700 border-t-[#500000] rounded-full mb-4"
              />
              <p className="text-neutral-400">Processing your query...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {hasSearched && !isSearching && results && (
          <ResultsDisplay
            query={query}
            requestedEngine={selectedAlgorithm}
            response={results}
            topK={topK}
          />
        )}

        {hasSearched && !isSearching && !results && !error && (
          <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-6 text-neutral-300">
            No results yet. Try a different query or algorithm.
          </div>
        )}
      </div>
    </div>
  );
}
