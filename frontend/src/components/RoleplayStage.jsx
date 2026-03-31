import React, { useState, useRef, useEffect } from 'react'
import RoleplaySetup from './RoleplaySetup'
import ConversationTabs from './ConversationTabs'
import { useSSE } from '../hooks/useSSE'
import API_BASE from '../config'

const MODEL_COLORS = [
  'text-blue-400',
  'text-emerald-400',
  'text-purple-400',
]

const MODEL_BG = [
  'bg-blue-500/10 border-blue-500/20',
  'bg-emerald-500/10 border-emerald-500/20',
  'bg-purple-500/10 border-purple-500/20',
]

export default function RoleplayStage({ models, onTranscriptChange }) {
  const [tabs, setTabs] = useState([{ id: 1, label: 'Run 1', messages: [], ended: null, config: null }])
  const [activeTab, setActiveTab] = useState(1)
  const [nextId, setNextId] = useState(2)
  const messagesEndRef = useRef(null)
  const { isStreaming, startStream, stop } = useSSE()

  const activeConvo = tabs.find(t => t.id === activeTab)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConvo?.messages])

  // Notify parent of transcript changes
  useEffect(() => {
    if (activeConvo) {
      const transcript = buildTranscript(activeConvo)
      onTranscriptChange(transcript, activeTab)
    }
  }, [activeConvo?.messages, activeTab])

  function buildTranscript(convo) {
    if (!convo.messages.length) return ''
    const lines = convo.messages.map(m =>
      `[${m.character} / ${m.model}]: ${m.content}`
    )
    if (convo.ended) {
      if (convo.ended.reason === 'max_turns') lines.push('[Scene ended: max turns reached]')
      else if (convo.ended.ended_by) lines.push(`[Scene ended by ${convo.ended.ended_by}]`)
    }
    return lines.join('\n')
  }

  const updateTab = (id, updater) => {
    setTabs(ts => ts.map(t => t.id === id ? updater(t) : t))
  }

  const handleStart = (config) => {
    updateTab(activeTab, t => ({ ...t, messages: [], ended: null, config }))
    startStream(
      `${API_BASE}/api/roleplay`,
      config,
      (turn) => {
        updateTab(activeTab, t => ({
          ...t,
          messages: [...t.messages, {
            round: turn.round,
            model: turn.model,
            character: turn.character,
            content: turn.content,
            end_vote: turn.end_vote,
          }],
          config: t.config || config
        }))
      },
      (ended) => {
        updateTab(activeTab, t => ({ ...t, ended }))
      },
      (err) => {
        updateTab(activeTab, t => ({
          ...t,
          ended: { error: err }
        }))
      }
    )
  }

  const handleStop = () => stop()

  const addTab = () => {
    const id = nextId
    setNextId(n => n + 1)
    setTabs(ts => [...ts, { id, label: `Run ${id}`, messages: [], ended: null, config: null }])
    setActiveTab(id)
    if (isStreaming) stop()
  }

  const closeTab = (id) => {
    const remaining = tabs.filter(t => t.id !== id)
    setTabs(remaining)
    if (activeTab === id) setActiveTab(remaining[remaining.length - 1].id)
  }

  const chars = activeConvo?.config?.characters || []

  return (
    <div className="flex flex-col h-full">
      <ConversationTabs
        tabs={tabs}
        activeTab={activeTab}
        onSelect={(id) => { setActiveTab(id); if (isStreaming) stop() }}
        onAdd={addTab}
        onClose={closeTab}
      />

      <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-dark-card rounded-tl-none rounded-xl border border-slate-200 dark:border-white/10 mx-4 mb-4 overflow-hidden">
        {/* Setup form */}
        <div className="border-b border-slate-200 dark:border-white/10 overflow-y-auto max-h-[45%]">
          <RoleplaySetup
            models={models}
            onStart={handleStart}
            onStop={handleStop}
            isStreaming={isStreaming}
          />
        </div>

        {/* Conversation display */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeConvo?.messages.length === 0 && !isStreaming && (
            <div className="text-center text-slate-400 dark:text-slate-500 text-sm py-8">
              Configure a scenario above and press Start Scene
            </div>
          )}

          {activeConvo?.messages.map((msg, i) => {
            const charIdx = chars.findIndex(c => c.model === msg.model)
            const colorClass = MODEL_COLORS[Math.max(0, charIdx)]
            const bgClass = MODEL_BG[Math.max(0, charIdx)]

            return (
              <div key={i} className={`rounded-xl p-3 border ${bgClass}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold ${colorClass}`}>{msg.character}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{msg.model}</span>
                  {msg.end_vote && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded px-1.5 py-0.5">voted /end</span>
                  )}
                  <span className="text-xs text-slate-300 dark:text-slate-600 ml-auto">#{msg.round}</span>
                </div>
                <p className="text-sm dark:text-dark-text text-slate-700 leading-relaxed">{msg.content}</p>
              </div>
            )
          })}

          {isStreaming && (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{animationDelay:'0ms'}}/>
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{animationDelay:'150ms'}}/>
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{animationDelay:'300ms'}}/>
              </div>
              <span className="text-xs">scene in progress…</span>
            </div>
          )}

          {activeConvo?.ended && (
            <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-2 border-t border-slate-200 dark:border-white/10">
              {activeConvo.ended.error
                ? `Error: ${activeConvo.ended.error}`
                : activeConvo.ended.reason === 'max_turns'
                  ? 'Scene ended — max turns reached'
                  : activeConvo.ended.reason === 'unanimous'
                    ? 'Scene ended — all characters voted to end'
                    : 'Scene ended'
              }
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  )
}
