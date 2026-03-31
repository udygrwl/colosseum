import { useState, useRef, useEffect } from 'react'
import API_BASE from '../config'

export default function OverseerPanel({ models, context }) {
  const [overseerModel, setOverseerModel] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-select first model if none selected
  useEffect(() => {
    if (!overseerModel && models.length > 0) {
      setOverseerModel(models[0].id)
    }
  }, [models, overseerModel])

  const sendMessage = async () => {
    if (!input.trim() || !overseerModel || loading) return

    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/overseer/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_id: overseerModel,
          message: userMsg.content,
          history: messages,
          context: context || '',
        }),
      })
      const data = await res.json()
      if (data.content) {
        setMessages([...newMessages, { role: 'assistant', content: data.content }])
      } else if (data.detail) {
        setMessages([...newMessages, { role: 'assistant', content: `Error: ${data.detail}` }])
      }
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: `Error: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-600"

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Overseer</h2>
        <select
          value={overseerModel}
          onChange={e => setOverseerModel(e.target.value)}
          className={inputCls}
        >
          <option value="">Select overseer model...</option>
          {models.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 dark:text-slate-500 text-xs py-8">
            {context
              ? 'Ask the Overseer about the model responses...'
              : 'Run a prompt or start a roleplay first. The Overseer will be able to see all responses.'
            }
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce" style={{animationDelay:'0ms'}}/>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce" style={{animationDelay:'150ms'}}/>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce" style={{animationDelay:'300ms'}}/>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the Overseer..."
            rows={2}
            className={`${inputCls} resize-none flex-1`}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !overseerModel || loading}
            className="px-3 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-end"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
