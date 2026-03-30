import { useState } from 'react'

const MODEL_COLORS = {
  'claude-opus-4-6':            { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-700/40', badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-200' },
  'claude-sonnet-4-6':          { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-700/40', badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-200' },
  'claude-3-7-sonnet-20250219': { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-700/40', badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-200' },
  'claude-haiku-4-5-20251001':  { bg: 'bg-orange-50 dark:bg-orange-900/15', border: 'border-orange-200 dark:border-orange-700/30', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300' },
  'claude-3-5-sonnet-20241022': { bg: 'bg-orange-50 dark:bg-orange-900/15', border: 'border-orange-200 dark:border-orange-700/30', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300' },
  'claude-3-5-haiku-20241022':  { bg: 'bg-orange-50 dark:bg-orange-900/15', border: 'border-orange-200 dark:border-orange-700/30', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300' },
  'gemini-2.5-pro':   { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700/40', badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200' },
  'gemini-2.5-flash': { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700/40', badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200' },
  'gemini-2.0-flash': { bg: 'bg-blue-50 dark:bg-blue-900/15', border: 'border-blue-200 dark:border-blue-700/30', badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300' },
  'gemini-1.5-pro':   { bg: 'bg-blue-50 dark:bg-blue-900/15', border: 'border-blue-200 dark:border-blue-700/30', badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300' },
  'o3':          { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-700/40', badge: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200' },
  'o3-mini':     { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-700/40', badge: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200' },
  'o1':          { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-700/40', badge: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200' },
  'gpt-4o':      { bg: 'bg-green-50 dark:bg-green-900/15', border: 'border-green-200 dark:border-green-700/30', badge: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300' },
  'gpt-4o-mini': { bg: 'bg-green-50 dark:bg-green-900/15', border: 'border-green-200 dark:border-green-700/30', badge: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300' },
}

const DEFAULT_COLORS = { bg: 'bg-slate-50 dark:bg-slate-800/40', border: 'border-slate-200 dark:border-slate-700/40', badge: 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300' }

export default function ModelCard({ result, roundKey }) {
  const [expanded, setExpanded] = useState(true)
  const colors = MODEL_COLORS[result.model] || DEFAULT_COLORS
  const subtitle = roundKey === 'round1' ? `Critiquing: ${result.critiqued?.join(', ')}` : null

  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 flex-wrap text-left">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
            {result.model_name}
          </span>
          {subtitle && <span className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</span>}
        </div>
        <span className="text-slate-400 dark:text-slate-600 text-sm ml-2 shrink-0">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {result.content}
          </div>
        </div>
      )}
    </div>
  )
}
