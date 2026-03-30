import { useState, useRef, useEffect } from 'react'

function buildTranscript(conversations) {
  const withTurns = conversations.filter(c => c.turns.length > 0)
  if (!withTurns.length) return ''
  return withTurns.map(conv => {
    const actors = conv.config.actors.map(a => `${a.role} → ${a.modelId}`).join(', ')
    const header = `[${conv.label}] Scenario: ${conv.config.scenario}\nActors: ${actors}`
    const body = conv.turns.map(t => `${t.role}: ${t.content}`).join('\n')
    return `${header}\n\n${body}`
  }).join('\n\n' + '─'.repeat(30) + '\n\n')
}

export default function AnalysisPanel({
  models, chatHistory, onSend, isThinking, conversations, selectedConvId,
}) {
  const [analysisModel, setAnalysisModel] = useState('')
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Default to first available model
  useEffect(() => {
    if (models.length && !analysisModel) setAnalysisModel(models[0].id)
  }, [models])

  // Auto-scroll chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory.length, isThinking])

  const selectedConv = conversations.find(c => c.id === selectedConvId)
  const hasTranscript = conversations.some(c => c.turns.length > 0)

  const handleSend = () => {
    const msg = input.trim()
    if (!msg || !analysisModel || isThinking) return
    onSend(msg, analysisModel)
    setInput('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const suggestedQuestions = [
    'Who was most in character?',
    'Where did the scene feel forced?',
    'Compare the models\' dialogue styles.',
    'Which turn was the turning point?',
  ]

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0f1117]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">🔬 Analysis</span>
          {hasTranscript && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
              {conversations.filter(c => c.turns.length > 0).length} transcript{conversations.filter(c => c.turns.length > 0).length !== 1 ? 's' : ''} loaded
            </span>
          )}
        </div>

        {/* Model selector */}
        <select
          value={analysisModel}
          onChange={e => setAnalysisModel(e.target.value)}
          className="w-full rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="">Select analysis model...</option>
          {models.map(m => (
            <option key={m.id} value={m.id}>
              {m.name}{m.thinking ? ' ✦' : ''}{m.reasoning ? ' ⚡' : ''}
            </option>
          ))}
        </select>

        {/* Context indicator */}
        {selectedConv && (
          <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-600 leading-relaxed">
            Context: all {conversations.filter(c => c.turns.length > 0).length} completed run(s) · {conversations.reduce((s, c) => s + c.turns.length, 0)} total turns
          </div>
        )}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {chatHistory.length === 0 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 dark:text-slate-600 leading-relaxed">
              Ask anything about the roleplay transcripts. Questions, comparisons, analysis...
            </p>
            {!hasTranscript && (
              <p className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 border border-amber-200 dark:border-amber-800/40">
                Run a roleplay scene first — the transcript will load here automatically.
              </p>
            )}
            {hasTranscript && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-wider font-medium">Suggested</p>
                {suggestedQuestions.map(q => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus() }}
                    className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:border-amber-400 dark:hover:border-amber-600 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {chatHistory.map(msg => (
          <div key={msg.id} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.role === 'assistant' && (
              <span className="text-[10px] text-slate-400 dark:text-slate-600 px-1">
                {models.find(m => m.id === msg.modelId)?.name || 'Assistant'}
              </span>
            )}
            <div className={`max-w-full rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-amber-600 text-white rounded-br-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex flex-col items-start gap-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-600 px-1">
              {models.find(m => m.id === analysisModel)?.name || 'Thinking...'}
            </span>
            <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl rounded-bl-sm px-3 py-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasTranscript ? 'Ask about the scene...' : 'Run a scene first...'}
            disabled={!hasTranscript || isThinking || !analysisModel}
            rows={2}
            className="flex-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !analysisModel || isThinking || !hasTranscript}
            className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white text-xs font-semibold transition-colors disabled:cursor-not-allowed self-end"
          >
            ↑
          </button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
