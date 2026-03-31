import { useState, useRef, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const TIER_META = {
  1: { label: 'Flagship',  desc: 'Most capable, highest cost',  color: 'amber' },
  2: { label: 'Balanced',  desc: 'Strong performance, mid cost', color: 'blue'  },
  3: { label: 'Lite',      desc: 'Fast & efficient, low cost',  color: 'green' },
}

const PROVIDER_META = {
  anthropic: { label: 'Claude',  icon: '🟠' },
  openai:    { label: 'ChatGPT', icon: '🟢' },
  google:    { label: 'Gemini',  icon: '🔵' },
}

function ModelSelector({ models, approvedTopic, useThinking, setUseThinking, onLaunch }) {
  const [tier, setTier] = useState(1)
  const [picks, setPicks] = useState({ anthropic: '', openai: '', google: '' })

  // Auto-select first available model per provider when tier changes
  useEffect(() => {
    const next = { anthropic: '', openai: '', google: '' }
    for (const provider of ['anthropic', 'openai', 'google']) {
      const opts = models.filter(m => m.provider === provider && m.tier === tier)
      if (opts.length > 0) next[provider] = opts[0].id
    }
    setPicks(next)
  }, [tier, models])

  const setPick = (provider, val) => setPicks(p => ({ ...p, [provider]: val }))

  const tierModels = (provider) => models.filter(m => m.provider === provider && m.tier === tier)
  const hasTier    = (t) => ['anthropic', 'openai', 'google'].every(p => models.some(m => m.provider === p && m.tier === t))
  const canLaunch  = Object.values(picks).every(Boolean)
  const hasThinking = models.filter(m => m.thinking || m.reasoning).length > 0

  const inputCls = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'

  const tierBtnCls = (t) => {
    const active = tier === t
    const meta   = TIER_META[t]
    if (!hasTier(t)) return 'opacity-30 cursor-not-allowed px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-400'
    if (active) {
      const colors = {
        1: 'bg-amber-600 text-white border-amber-600',
        2: 'bg-blue-600 text-white border-blue-600',
        3: 'bg-green-600 text-white border-green-600',
      }
      return `px-3 py-1.5 rounded-lg text-xs font-medium border ${colors[t]}`
    }
    return 'px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 transition-colors'
  }

  return (
    <div className="mx-5 mb-4 rounded-lg border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-4">
      {/* Approved topic */}
      <div>
        <div className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">✓ Debate approved</div>
        <div className="text-sm text-slate-700 dark:text-slate-200 font-medium">{approvedTopic}</div>
      </div>

      {/* Tier selector */}
      <div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Select tier — all models must be the same level</div>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3].map(t => (
            <button
              key={t}
              onClick={() => hasTier(t) && setTier(t)}
              className={tierBtnCls(t)}
            >
              {TIER_META[t].label}
              <span className="ml-1 opacity-60 font-normal hidden sm:inline">— {TIER_META[t].desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Per-provider dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {['anthropic', 'openai', 'google'].map(provider => {
          const opts = tierModels(provider)
          const meta = PROVIDER_META[provider]
          return (
            <div key={provider}>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                {meta.icon} {meta.label}
              </label>
              <select
                value={picks[provider]}
                onChange={e => setPick(provider, e.target.value)}
                disabled={opts.length === 0}
                className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-40 ${inputCls}`}
              >
                {opts.length === 0
                  ? <option value="">No models in this tier</option>
                  : opts.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}{m.thinking ? ' ✦' : ''}{m.reasoning ? ' ⚡' : ''}
                    </option>
                  ))
                }
              </select>
            </div>
          )
        })}
      </div>

      {/* Thinking toggle + launch */}
      <div className="flex items-center justify-between pt-1">
        {hasThinking ? (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setUseThinking(v => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${useThinking ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${useThinking ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Research mode <span className="text-amber-500">✦</span></span>
          </label>
        ) : <div />}

        <button
          onClick={() => canLaunch && onLaunch([picks.anthropic, picks.openai, picks.google], useThinking)}
          disabled={!canLaunch}
          className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          Launch Debate →
        </button>
      </div>

      <div className="text-[10px] text-slate-400 dark:text-slate-500">
        <span className="text-amber-500">✦</span> extended thinking &nbsp;·&nbsp; <span className="text-yellow-500">⚡</span> always-on reasoning
      </div>
    </div>
  )
}

export default function JudgeChat({
  judgeModel,
  judgeModelName,
  models,
  onDebateReady,
  postDebate,
  transcript,
  verdict,
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [approvedTopic, setApprovedTopic] = useState(null)
  const [useThinking, setUseThinking] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, approvedTopic])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const newHistory = [...messages, { role: 'user', content: text }]
    setMessages(newHistory)
    setLoading(true)

    try {
      const endpoint = postDebate ? '/api/judge/post-debate-chat' : '/api/judge/chat'
      const body = postDebate
        ? { judge_model: judgeModel, message: text, history: messages, transcript, verdict }
        : { judge_model: judgeModel, message: text, history: messages }

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setMessages([...newHistory, { role: 'assistant', content: data.content }])

      if (data.debate_topic && !approvedTopic) {
        setApprovedTopic(data.debate_topic)
      }
    } catch (e) {
      setMessages([...newHistory, { role: 'assistant', content: `[Error: ${e.message}]` }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const inputCls = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500'

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col" style={{ minHeight: '480px' }}>
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {postDebate ? 'Post-debate · ' : ''}Judge
        </span>
        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{judgeModelName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ maxHeight: '420px' }}>
        {messages.length === 0 && (
          <div className="text-center text-sm text-slate-400 dark:text-slate-500 pt-8">
            {postDebate
              ? 'Ask the judge about the verdict or explore the debate further.'
              : "Tell the judge what's on your mind. They'll figure out if it needs a debate."}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-amber-600 text-white rounded-br-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Model selector — shown when judge approves a topic */}
      {approvedTopic && !postDebate && (
        <ModelSelector
          models={models}
          approvedTopic={approvedTopic}
          useThinking={useThinking}
          setUseThinking={setUseThinking}
          onLaunch={(advocateModels, thinking) => onDebateReady(approvedTopic, advocateModels, thinking)}
        />
      )}

      {/* Input */}
      <div className="px-5 pb-4 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={postDebate ? 'Ask about the verdict…' : 'What\'s on your mind?'}
          disabled={loading}
          className={`flex-1 rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 ${inputCls}`}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  )
}
