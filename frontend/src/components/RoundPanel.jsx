import { useState } from 'react'
import ModelCard from './ModelCard'

export default function RoundPanel({ roundKey, label, icon, data, borderColor, badgeStyle }) {
  const [open, setOpen] = useState(true)
  const isVerdict = roundKey === 'verdict'

  return (
    <div className={`rounded-xl border ${borderColor} bg-white dark:bg-slate-900/50 overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeStyle}`}>
            {icon} {isVerdict ? 'Verdict' : label.split('—')[0].trim()}
          </span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:inline">{label}</span>
        </div>
        <span className="text-slate-400 dark:text-slate-500">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3">
          {isVerdict ? (
            <VerdictContent data={data} />
          ) : (
            data.results.map(r => (
              <ModelCard key={r.model} result={r} roundKey={roundKey} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function VerdictContent({ data }) {
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-purple-200 dark:border-purple-700/30 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-slate-400 uppercase tracking-wider">Judge:</span>
        <span className="text-sm font-medium text-purple-600 dark:text-purple-300">{data.judge_model_name}</span>
      </div>
      <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
        {data.content}
      </div>
    </div>
  )
}
