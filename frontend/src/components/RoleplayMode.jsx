import { useState, useRef, useEffect } from 'react'
import { Play, StopCircle } from 'lucide-react'
import { useSSE } from '../hooks/useSSE'
import API_BASE from '../config'

const CHAR_COLORS = [
  { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
]

export default function RoleplayMode({ models, onTranscriptChange }) {
  const [numChars, setNumChars] = useState(2)
  const [scenario, setScenario] = useState('')
  const [maxTurns, setMaxTurns] = useState('')
  const [characters, setCharacters] = useState([
    { model: '', character_name: '', role_description: '' },
    { model: '', character_name: '', role_description: '' },
    { model: '', character_name: '', role_description: '' },
  ])
  const [messages, setMessages] = useState([])
  const [ended, setEnded] = useState(null)
  const messagesEndRef = useRef(null)
  const { isStreaming, startStream, stop } = useSSE()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Build transcript for overseer
  useEffect(() => {
    if (messages.length === 0) {
      onTranscriptChange('')
      return
    }
    const lines = messages.map(m => `[${m.character} / ${m.model}]: ${m.content}`)
    if (ended) {
      if (ended.reason === 'max_turns') lines.push('[Scene ended: max turns reached]')
      else if (ended.reason === 'unanimous') lines.push('[Scene ended: all characters voted /end]')
    }
    onTranscriptChange('Roleplay Transcript:\n' + lines.join('\n'))
  }, [messages, ended])

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-600 placeholder:text-slate-400"
  const labelCls = "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide"

  const updateChar = (i, field, val) => {
    setCharacters(cs => cs.map((c, idx) => idx === i ? { ...c, [field]: val } : c))
  }

  const changeNumChars = (n) => {
    setNumChars(n)
  }

  const handleStart = () => {
    const chars = characters.slice(0, numChars)
    if (!scenario.trim() || chars.some(c => !c.model || !c.role_description.trim())) return
    setMessages([])
    setEnded(null)

    const config = {
      scenario: scenario.trim(),
      characters: chars,
      max_turns: maxTurns ? parseInt(maxTurns) : null,
    }

    startStream(
      `${API_BASE}/api/roleplay`,
      config,
      (turn) => {
        setMessages(prev => [...prev, {
          round: turn.round,
          model: turn.model,
          character: turn.character,
          content: turn.content,
          end_vote: turn.end_vote,
        }])
      },
      (endData) => {
        setEnded(endData)
      },
      (err) => {
        setEnded({ error: err })
      }
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Setup form */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[45%] p-4 space-y-4">
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
                    ? 'bg-amber-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-amber-600'
                }`}
              >
                {n} Characters
              </button>
            ))}
          </div>
        </div>

        {/* Character cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {characters.slice(0, numChars).map((char, i) => (
            <div key={i} className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-600/20 flex items-center justify-center text-amber-600 text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Character {i + 1}</span>
              </div>
              <select
                value={char.model}
                onChange={e => updateChar(i, 'model', e.target.value)}
                className={inputCls}
              >
                <option value="">Select model...</option>
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Character name"
                value={char.character_name}
                onChange={e => updateChar(i, 'character_name', e.target.value)}
                className={inputCls}
              />
              <textarea
                placeholder="Role description"
                value={char.role_description}
                onChange={e => updateChar(i, 'role_description', e.target.value)}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>
          ))}
        </div>

        {/* Scenario + controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className={labelCls}>Scenario</label>
            <textarea
              placeholder="Describe the situation..."
              value={scenario}
              onChange={e => setScenario(e.target.value)}
              rows={2}
              className={`${inputCls} mt-1.5 resize-none`}
            />
          </div>
          <div className="space-y-2">
            <div>
              <label className={labelCls}>Max Turns</label>
              <input
                type="number"
                placeholder="Unlimited"
                value={maxTurns}
                onChange={e => setMaxTurns(e.target.value)}
                min={1}
                className={`${inputCls} mt-1.5`}
              />
            </div>
            <div>
              {!isStreaming ? (
                <button
                  onClick={handleStart}
                  disabled={!scenario.trim() || characters.slice(0, numChars).some(c => !c.model || !c.role_description.trim())}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play size={16} /> Start Scene
                </button>
              ) : (
                <button
                  onClick={stop}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
                >
                  <StopCircle size={16} /> Stop
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conversation display */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center text-slate-400 dark:text-slate-500 text-sm py-8">
            Configure a scenario above and press Start Scene
          </div>
        )}

        {messages.map((msg, i) => {
          const charIdx = characters.slice(0, numChars).findIndex(c =>
            c.character_name === msg.character || c.model === msg.model
          )
          const colors = CHAR_COLORS[Math.max(0, charIdx)]

          return (
            <div key={i} className={`rounded-xl p-3 border ${colors.border} ${colors.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold ${colors.text}`}>{msg.character}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{msg.model}</span>
                {msg.end_vote && (
                  <span className="text-xs bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded px-1.5 py-0.5">voted /end</span>
                )}
                <span className="text-xs text-slate-300 dark:text-slate-600 ml-auto">#{msg.round}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{msg.content}</p>
            </div>
          )
        })}

        {isStreaming && (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce" style={{animationDelay:'0ms'}}/>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce" style={{animationDelay:'150ms'}}/>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce" style={{animationDelay:'300ms'}}/>
            </div>
            <span className="text-xs">scene in progress...</span>
          </div>
        )}

        {ended && (
          <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-2 border-t border-slate-200 dark:border-slate-800">
            {ended.error
              ? `Error: ${ended.error}`
              : ended.reason === 'max_turns'
                ? 'Scene ended -- max turns reached'
                : ended.reason === 'unanimous'
                  ? 'Scene ended -- all characters voted to end'
                  : 'Scene ended'
            }
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
