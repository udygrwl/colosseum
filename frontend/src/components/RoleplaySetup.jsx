import React, { useState } from 'react'
import { Play, StopCircle } from 'lucide-react'

export default function RoleplaySetup({ models, onStart, onStop, isStreaming }) {
  const [numChars, setNumChars] = useState(2)
  const [scenario, setScenario] = useState('')
  const [maxTurns, setMaxTurns] = useState('')
  const [characters, setCharacters] = useState([
    { model: '', character_name: '', role_description: '' },
    { model: '', character_name: '', role_description: '' },
  ])

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-bg border border-slate-200 dark:border-white/10 dark:text-dark-text text-slate-800 focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-slate-400"
  const labelCls = "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide"

  const updateChar = (i, field, val) => {
    setCharacters(cs => cs.map((c, idx) => idx === i ? { ...c, [field]: val } : c))
  }

  const changeNumChars = (n) => {
    setNumChars(n)
    setCharacters(cs => {
      const next = [...cs]
      while (next.length < n) next.push({ model: '', character_name: '', role_description: '' })
      return next.slice(0, n)
    })
  }

  const handleStart = () => {
    const chars = characters.slice(0, numChars)
    if (!scenario.trim() || chars.some(c => !c.model || !c.role_description.trim())) return
    onStart({
      scenario: scenario.trim(),
      characters: chars,
      max_turns: maxTurns ? parseInt(maxTurns) : null
    })
  }

  if (models.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
        No models available. Check your API keys.
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* Number of characters */}
      <div>
        <label className={labelCls}>Characters</label>
        <div className="flex gap-2 mt-1.5">
          {[2, 3].map(n => (
            <button
              key={n}
              onClick={() => changeNumChars(n)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                numChars === n
                  ? 'bg-accent text-white'
                  : 'bg-white dark:bg-dark-bg border border-slate-200 dark:border-white/10 dark:text-dark-text text-slate-600 hover:border-accent'
              }`}
            >
              {n} Characters
            </button>
          ))}
        </div>
      </div>

      {/* Characters */}
      {characters.slice(0, numChars).map((char, i) => (
        <div key={i} className="rounded-xl p-3 bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">
              {i + 1}
            </div>
            <span className="text-sm font-medium dark:text-dark-text text-slate-700">Character {i + 1}</span>
          </div>
          <select
            value={char.model}
            onChange={e => updateChar(i, 'model', e.target.value)}
            className={inputCls}
          >
            <option value="">Select model…</option>
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Character name (e.g. CEO, Investor)"
            value={char.character_name}
            onChange={e => updateChar(i, 'character_name', e.target.value)}
            className={inputCls}
          />
          <textarea
            placeholder="Role description (e.g. You are a startup CEO negotiating a Series A term sheet)"
            value={char.role_description}
            onChange={e => updateChar(i, 'role_description', e.target.value)}
            rows={2}
            className={`${inputCls} resize-none`}
          />
        </div>
      ))}

      {/* Scenario */}
      <div>
        <label className={labelCls}>Scenario</label>
        <textarea
          placeholder="Describe the situation they're in (e.g. A tense Series A negotiation in a San Francisco boardroom)"
          value={scenario}
          onChange={e => setScenario(e.target.value)}
          rows={3}
          className={`${inputCls} mt-1.5 resize-none`}
        />
      </div>

      {/* Max turns */}
      <div>
        <label className={labelCls}>Max Turns (optional)</label>
        <input
          type="number"
          placeholder="Leave empty for unlimited"
          value={maxTurns}
          onChange={e => setMaxTurns(e.target.value)}
          min={1}
          className={`${inputCls} mt-1.5`}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        {!isStreaming ? (
          <button
            onClick={handleStart}
            disabled={!scenario.trim() || characters.slice(0, numChars).some(c => !c.model || !c.role_description.trim())}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play size={16} /> Start Scene
          </button>
        ) : (
          <button
            onClick={onStop}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
          >
            <StopCircle size={16} /> Stop
          </button>
        )}
      </div>
    </div>
  )
}
