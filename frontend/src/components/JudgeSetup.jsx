import { useState, useEffect } from 'react'

export default function JudgeSetup({ models, onStart }) {
  const [judge, setJudge] = useState('')

  useEffect(() => {
    if (models.length > 0 && !judge) setJudge(models[0].id)
  }, [models])

  const input = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'

  if (models.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 text-center text-slate-400 text-sm">
        Loading models...
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 space-y-6 text-center">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-1">Colosseum</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Start by choosing a judge. You'll discuss your topic together before the debate begins.
        </p>
      </div>

      <div className="max-w-xs mx-auto space-y-3">
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 text-left">Select Judge</label>
        <select
          value={judge}
          onChange={e => setJudge(e.target.value)}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${input}`}
        >
          {models.map(m => (
            <option key={m.id} value={m.id}>
              {m.name}{m.thinking ? ' ✦' : ''}{m.reasoning ? ' ⚡' : ''}
            </option>
          ))}
        </select>
        <button
          onClick={() => judge && onStart(judge)}
          disabled={!judge}
          className="w-full px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          Start conversation →
        </button>
      </div>
    </div>
  )
}
