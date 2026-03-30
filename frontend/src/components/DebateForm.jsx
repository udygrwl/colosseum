import { useState, useEffect } from 'react'

export default function DebateForm({ models, onSubmit, disabled }) {
  const [topic, setTopic] = useState('')
  const [advocates, setAdvocates] = useState(['', '', ''])
  const [judge, setJudge] = useState('')
  const [useThinking, setUseThinking] = useState(false)

  useEffect(() => {
    if (models.length >= 3 && advocates.every(a => a === '')) {
      setAdvocates([models[0].id, models[1].id, models[2 % models.length].id])
      setJudge(models[0].id)
    }
  }, [models])

  const setAdvocate = (i, val) => {
    const next = [...advocates]; next[i] = val; setAdvocates(next)
  }

  const canSubmit = topic.trim() && advocates.every(a => a) && judge && !disabled
  const thinkingModels = models.filter(m => m.thinking || m.reasoning)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (canSubmit) onSubmit(topic.trim(), advocates, judge, useThinking)
  }

  const input = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500'
  const label = 'text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5'

  if (models.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 text-center text-slate-500 text-sm">
        Loading models...
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 space-y-5">
      <div>
        <label className={`block ${label}`}>Debate Topic</label>
        <textarea
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g. Is nuclear energy essential for fighting climate change?"
          disabled={disabled}
          rows={3}
          className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none disabled:opacity-50 ${input}`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i}>
            <label className={`block ${label}`}>Advocate {i + 1}</label>
            <select
              value={advocates[i]}
              onChange={e => setAdvocate(i, e.target.value)}
              disabled={disabled}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 ${input}`}
            >
              <option value="">Select model...</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}{m.thinking ? ' ✦' : ''}{m.reasoning ? ' ⚡' : ''}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <label className={`block ${label}`}>Judge Model</label>
          <select
            value={judge}
            onChange={e => setJudge(e.target.value)}
            disabled={disabled}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 ${input}`}
          >
            <option value="">Select judge...</option>
            {models.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}{m.thinking ? ' ✦' : ''}{m.reasoning ? ' ⚡' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          {thinkingModels.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => !disabled && setUseThinking(v => !v)}
                className={`relative w-9 h-5 rounded-full transition-colors ${useThinking ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${useThinking ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Research mode <span className="text-amber-500">✦</span>
              </span>
            </label>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 text-white text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
          >
            {disabled ? 'Running...' : 'Start Debate'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
        <span>Legend:</span>
        <span><span className="text-amber-500">✦</span> extended thinking</span>
        <span><span className="text-yellow-500">⚡</span> always-on reasoning (o-series)</span>
      </div>
    </form>
  )
}
