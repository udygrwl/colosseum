import React, { useState, useRef, useEffect } from 'react'
import { Send, RotateCcw } from 'lucide-react'
import API_BASE from '../config'

export default function AnalysisPanel({ models, transcript }) {
  const [selectedModel, setSelectedModel] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id)
    }
  }, [models])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || !selectedModel || loading) return

    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          message: userMsg.content,
          conversation_history: messages,
          roleplay_transcript: transcript || ''
        })
      })
      const data = await res.json()
      setMessages(ms => [...ms, { role: 'assistant', content: data.response }])
    } catch (e) {
      setMessages(ms => [...ms, { role: 'assistant', content: `Error: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-bg border border-slate-200 dark:border-white/10 dark:text-dark-text text-slate-800 focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-slate-400"

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-card border border-slate-200 dark:border-white/10 rounded-xl m-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10">
        <div>
          <h2 className="font-semibold text-sm dark:text-dark-text text-slate-800">Analysis</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Ask questions about the roleplay</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            className="text-xs rounded-lg px-2 py-1.5 bg-white dark:bg-dark-bg border border-slate-200 dark:border-white/10 dark:text-dark-text text-slate-700 focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <button
            onClick={() => setMessages([])}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="Clear chat"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Context indicator */}
      {transcript && (
        <div className="px-4 py-2 bg-accent/10 border-b border-accent/20">
          <p className="text-xs text-accent">Transcript loaded — ask me anything about the scene</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 dark:text-slate-500 text-sm py-8 space-y-2">
            <p>Run a roleplay scenario, then ask me to analyze it.</p>
            <p className="text-xs">Try: "Who was more assertive?" or "Compare the negotiation styles"</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-slate-100 dark:bg-dark-bg dark:text-dark-text text-slate-700'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-dark-bg rounded-xl px-3 py-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:'0ms'}}/>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:'150ms'}}/>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:'300ms'}}/>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-200 dark:border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask about the conversation…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            className={inputCls}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading || !selectedModel}
            className="p-2 rounded-lg bg-accent text-white hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
