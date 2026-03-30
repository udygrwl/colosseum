import { useState, useEffect } from 'react'

const ACTOR_COLORS = [
  'border-amber-500/60 bg-amber-50 dark:bg-amber-900/10',
  'border-sky-500/60 bg-sky-50 dark:bg-sky-900/10',
  'border-emerald-500/60 bg-emerald-50 dark:bg-emerald-900/10',
]

const DEFAULT_SCENARIOS = [
  'A heist gone wrong — the vault is open, alarms are blaring, and the getaway car just left.',
  'A boardroom showdown: two execs discover they both secretly tanked the same deal.',
  'Two detectives interrogate each other after realizing they\'re both undercover.',
  'Last humans on a dying ship debate which one gets the escape pod.',
]

export default function RoleplayForm({ models, onSubmit, disabled }) {
  const [actors, setActors] = useState([
    { modelId: '', role: '' },
    { modelId: '', role: '' },
  ])
  const [scenario, setScenario] = useState('')
  const [maxTurns, setMaxTurns] = useState(12)

  useEffect(() => {
    if (models.length >= 2 && actors.every(a => !a.modelId)) {
      setActors(prev => prev.map((a, i) => ({
        ...a, modelId: models[i % models.length]?.id || '',
      })))
    }
  }, [models])

  const setActorField = (i, field, val) => {
    setActors(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a))
  }

  const addActor = () => {
    if (actors.length < 3) {
      setActors(prev => [...prev, { modelId: models[prev.length % models.length]?.id || '', role: '' }])
    }
  }

  const removeActor = (i) => {
    if (actors.length > 2) setActors(prev => prev.filter((_, idx) => idx !== i))
  }

  const canSubmit = !disabled && scenario.trim() && actors.every(a => a.modelId && a.role.trim())

  const handleSubmit = (e) => {
    e.preventDefault()
    if (canSubmit) onSubmit({ actors, scenario: scenario.trim(), maxTurns: maxTurns || 20 })
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-5">
      {/* Scenario */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scenario</label>
          <div className="flex gap-1">
            {DEFAULT_SCENARIOS.slice(0, 2).map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setScenario(s)}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                eg {i + 1}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={scenario}
          onChange={e => setScenario(e.target.value)}
          placeholder="Set the scene... What's the situation? Where are we?"
          disabled={disabled}
          rows={3}
          className="w-full rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none disabled:opacity-50"
        />
      </div>

      {/* Actors */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Actors ({actors.length})
          </label>
          {actors.length < 3 && (
            <button
              type="button"
              onClick={addActor}
              disabled={disabled}
              className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors disabled:opacity-50"
            >
              + Add 3rd
            </button>
          )}
        </div>
        <div className="space-y-2">
          {actors.map((actor, i) => (
            <div key={i} className={`rounded-lg border p-3 ${ACTOR_COLORS[i]}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-16 shrink-0">
                  Actor {i + 1}
                </span>
                {actors.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeActor(i)}
                    className="ml-auto text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={actor.modelId}
                  onChange={e => setActorField(i, 'modelId', e.target.value)}
                  disabled={disabled}
                  className="w-1/2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 px-2 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                >
                  <option value="">Model...</option>
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={actor.role}
                  onChange={e => setActorField(i, 'role', e.target.value)}
                  placeholder="Character / role..."
                  disabled={disabled}
                  className="flex-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 px-2 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Max turns + Submit */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Max turns</label>
          <input
            type="number"
            value={maxTurns}
            onChange={e => setMaxTurns(parseInt(e.target.value) || 0)}
            min={2}
            max={100}
            disabled={disabled}
            className="w-16 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 text-center disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {disabled ? '⏳ Running...' : '▶ Start Scene'}
        </button>
      </div>
    </form>
  )
}
