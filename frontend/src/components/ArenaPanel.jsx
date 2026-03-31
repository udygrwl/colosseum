import { RefreshCw } from 'lucide-react'

const PROVIDER_COLORS = {
  anthropic: { border: 'border-orange-500/30', bg: 'bg-orange-500/5', text: 'text-orange-500', label: 'Anthropic' },
  openai:    { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-500', label: 'OpenAI' },
  google:    { border: 'border-blue-500/30', bg: 'bg-blue-500/5', text: 'text-blue-500', label: 'Google' },
}

export default function ArenaPanel({ model, content, loading, onRefresh }) {
  if (!model) return null

  const colors = PROVIDER_COLORS[model.provider] || PROVIDER_COLORS.openai

  return (
    <div className={`flex flex-col rounded-xl border ${colors.border} ${colors.bg} overflow-hidden h-full`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase ${colors.text}`}>{colors.label}</span>
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{model.name}</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Re-run this model"
          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-full" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-4/6" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-full" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/6" />
          </div>
        ) : content ? (
          <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        ) : (
          <div className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
            Waiting for prompt...
          </div>
        )}
      </div>
    </div>
  )
}
