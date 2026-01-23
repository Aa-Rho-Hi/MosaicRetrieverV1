import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ChevronUp, FileText, Lightbulb, Bug } from 'lucide-react';
import type { SearchEngine, SearchResponse } from '../types/search';

interface ResultsDisplayProps {
  query: string;
  requestedEngine: SearchEngine;
  response: SearchResponse;
  topK?: number;
}

export function ResultsDisplay({ query, requestedEngine, response, topK }: ResultsDisplayProps) {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [showDebug, setShowDebug] = useState(false);

  const resolvedEngine = response.engine || requestedEngine;
  const sortedResults = [...(response.items || [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedResults(newExpanded);
  };

  const highlightQuery = (text: string) => {
    const safeText = text || '';
    const words = query.toLowerCase().split(' ').filter((w) => w.length > 2);
    let highlightedText = safeText;

    words.forEach((word) => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-[#500000] text-white px-1 rounded">$1</mark>');
    });

    return highlightedText;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-neutral-400">
            Found <span className="text-white">{sortedResults.length}</span> result{sortedResults.length === 1 ? '' : 's'} for "<span className="text-white">{query}</span>"
          </p>
          <div className="flex flex-wrap gap-2">
            <EngineBadge label="Requested" value={requestedEngine} />
            <EngineBadge label="Resolved" value={resolvedEngine} />
            {typeof topK === 'number' && <EngineBadge label="k" value={String(topK)} format="plain" />}
          </div>
        </div>
        <p className="text-neutral-500 text-sm">Scores normalized between 0-1; sorted by score.</p>
      </div>

      {sortedResults.length === 0 && (
        <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-6 text-neutral-300">
          No results returned by the backend.
        </div>
      )}

      <div className="space-y-4">
        {sortedResults.map((result, index) => {
          const key = result.id || `result-${index}`;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-neutral-800 rounded-lg">
                  <FileText className="w-6 h-6 text-[#500000]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white mb-2">{result.title || 'Untitled result'}</h3>
                  <p
                    className="text-neutral-400 mb-3"
                    dangerouslySetInnerHTML={{ __html: highlightQuery(result.snippet) }}
                  />

                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <ScoreBadge score={result.score} />
                    {result.id && <span className="text-xs text-neutral-500">ID: {result.id}</span>}
                  </div>

                  <button
                    onClick={() => toggleExpanded(key)}
                    className="flex items-center gap-2 text-[#500000] hover:text-[#700000] transition-colors"
                  >
                    {expandedResults.has(key) ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Hide details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Why this ranking?
                      </>
                    )}
                  </button>
                </div>
              </div>

              {expandedResults.has(key) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 pt-4 border-t border-neutral-800"
                >
                  <div className="bg-neutral-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-[#500000]" />
                      <span className="text-white">Explanation</span>
                    </div>
                    <p className="text-neutral-300">
                      {result.explanation || `Returned by the ${engineLabel(resolvedEngine)} engine.`}
                    </p>
                    <p className="text-neutral-500 text-sm mt-2">
                      Score: {(result.score * 100).toFixed(1)}%
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {response.debug && (
        <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-4">
          <button
            onClick={() => setShowDebug((prev) => !prev)}
            className="flex items-center gap-2 text-neutral-200 hover:text-white transition-colors"
          >
            <Bug className="w-4 h-4 text-[#500000]" />
            Debug payload
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showDebug ? 'rotate-180' : ''}`}
            />
          </button>
          {showDebug && (
            <motion.pre
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 text-sm bg-neutral-950 border border-neutral-800 rounded-xl p-3 overflow-auto whitespace-pre-wrap break-words text-neutral-300"
            >
              {JSON.stringify(response.debug, null, 2)}
            </motion.pre>
          )}
        </div>
      )}
    </motion.div>
  );
}

function EngineBadge({
  label,
  value,
  format = 'engine',
}: {
  label: string;
  value: string;
  format?: 'engine' | 'plain';
}) {
  const displayValue = format === 'engine' ? engineLabel(value) : value;
  return (
    <div className="px-3 py-1 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-200 text-sm flex items-center gap-2">
      <span className="text-neutral-400">{label}:</span>
      <span className="font-semibold text-white">{displayValue}</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const normalized = typeof score === 'number' ? Math.max(0, Math.min(1, score)) : 0;
  return (
    <div className="px-3 py-1 rounded-lg border bg-neutral-800 border-neutral-700 text-neutral-200">
      <span className="mr-2 text-neutral-400">Score:</span>
      <span>{(normalized * 100).toFixed(1)}%</span>
    </div>
  );
}

const engineLabel = (engine: string) => {
  const key = engine?.toLowerCase?.() || '';
  switch (key) {
    case 'auto':
      return 'Auto';
    case 'bm25':
      return 'BM25';
    case 'dense':
      return 'Dense';
    case 'hyde':
      return 'HyDE';
    case 'fusion':
      return 'Fusion';
    case 'ltr':
      return 'LTR';
    default:
      return engine || 'Unknown';
  }
};
