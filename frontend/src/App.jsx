import { useState, useEffect, useRef, useCallback } from 'react'
import NavBar from './components/NavBar'
import DebateForm from './components/DebateForm'
import DebateResults from './components/DebateResults'
import RoleplayPage from './components/roleplay/RoleplayPage'

const API = 'http://localhost:8000'
const ROUND_PROGRESS = { round0: 25, round1: 50, round2: 75, verdict: 100 }

function buildTranscript(conversations) {
  const done = conversations.filter(c => c.turns.length > 0)
  if (!done.length) return ''
  return done.map(conv => {
    const header = `=== ${conv.label} ===\nScenario: ${conv.config.scenario}\nActors: ${conv.config.actors.map(a => `${a.role} (${a.modelId})`).join(', ')}`
    const turns = conv.turns.map(t => `${t.role}: ${t.content}`).join('\n\n')
    return `${header}\n\n${turns}`
  }).join('\n\n' + '─'.repeat(40) + '\n\n')
}

export default function App() {
  // ── theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('athena-theme') || 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('athena-theme', theme)
  }, [theme])
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  // ── mode ───────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState('debate')

  // ── shared models ──────────────────────────────────────────────────────────
  const [models, setModels] = useState([])
  const [modelsError, setModelsError] = useState(null)
  useEffect(() => {
    fetch(`${API}/api/models`)
      .then(r => r.json())
      .then(d => setModels(d.models))
      .catch(() => setModelsError('Could not reach backend on port 8000.'))
  }, [])

  // ── debate state ───────────────────────────────────────────────────────────
  const [debateState, setDebateState] = useState(null)
  const [rounds, setRounds] = useState({})
  const [status, setStatus] = useState('')
  const [currentRound, setCurrentRound] = useState(null)
  const [progress, setProgress] = useState(0)

  const startDebate = (topic, advocateModels, judgeModel, useThinking) => {
    setRounds({}); setStatus(''); setCurrentRound(null); setProgress(0); setDebateState('running')
    fetch(`${API}/api/debate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, advocate_models: advocateModels, judge_model: judgeModel, use_thinking: useThinking }),
    }).then(response => {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const processChunk = ({ done, value }) => {
        if (done) { setDebateState('done'); return }
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n'); buffer = parts.pop()
        for (const part of parts) {
          if (!part.trim()) continue
          const lines = part.split('\n')
          let eventType = 'message', dataStr = ''
          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7)
            if (line.startsWith('data: '))  dataStr  = line.slice(6)
          }
          if (!dataStr) continue
          try {
            const payload = JSON.parse(dataStr)
            if (eventType === 'status') { setStatus(payload.message); setCurrentRound(payload.round) }
            else if (eventType === 'done') { setDebateState('done'); setStatus(''); setCurrentRound(null); setProgress(100) }
            else { setRounds(prev => ({ ...prev, [eventType]: payload })); setProgress(ROUND_PROGRESS[eventType] ?? 0) }
          } catch (e) { console.error('Parse error:', e) }
        }
        reader.read().then(processChunk)
      }
      reader.read().then(processChunk)
    }).catch(err => { setDebateState('error'); setStatus(`Error: ${err.message}`) })
  }

  // ── roleplay state ─────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState([])
  const [selectedConvId, setSelectedConvId] = useState(null)
  const roleplayAbortRef = useRef(null)

  const startRoleplay = useCallback((config) => {
    const id = crypto.randomUUID()
    const runNum = conversations.length + 1
    const newConv = {
      id, label: `Run ${runNum}`,
      startedAt: Date.now(),
      status: 'running',
      config,
      turns: [],
      endReason: null,
    }
    setConversations(prev => [...prev, newConv])
    setSelectedConvId(id)

    roleplayAbortRef.current = new AbortController()
    fetch(`${API}/api/roleplay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actors: config.actors.map(a => ({ model_id: a.modelId, role: a.role })),
        scenario: config.scenario,
        max_turns: config.maxTurns || 20,
      }),
      signal: roleplayAbortRef.current.signal,
    }).then(response => {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const processChunk = ({ done, value }) => {
        if (done) {
          setConversations(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'running' ? 'done' : c.status } : c))
          return
        }
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n'); buffer = parts.pop()
        for (const part of parts) {
          if (!part.trim()) continue
          const lines = part.split('\n')
          let eventType = 'message', dataStr = ''
          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7)
            if (line.startsWith('data: '))  dataStr  = line.slice(6)
          }
          if (!dataStr) continue
          try {
            const payload = JSON.parse(dataStr)
            if (eventType === 'turn') {
              setConversations(prev => prev.map(c =>
                c.id === id ? { ...c, turns: [...c.turns, payload] } : c
              ))
            } else if (eventType === 'done') {
              setConversations(prev => prev.map(c =>
                c.id === id ? { ...c, status: 'done', endReason: payload.reason } : c
              ))
            } else if (eventType === 'error') {
              setConversations(prev => prev.map(c =>
                c.id === id ? { ...c, status: 'error', endReason: payload.message } : c
              ))
            }
          } catch (e) { console.error('Roleplay parse error:', e) }
        }
        reader.read().then(processChunk)
      }
      reader.read().then(processChunk)
    }).catch(err => {
      if (err.name !== 'AbortError') {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, status: 'error', endReason: err.message } : c))
      } else {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, status: 'stopped', endReason: 'stopped' } : c))
      }
    })
  }, [conversations.length])

  const stopRoleplay = useCallback(() => {
    roleplayAbortRef.current?.abort()
  }, [])

  // ── analysis chat state ────────────────────────────────────────────────────
  const [chatHistory, setChatHistory] = useState([])
  const [isChatThinking, setIsChatThinking] = useState(false)

  const sendChatMessage = useCallback(async (message, modelId) => {
    const userMsg = { id: crypto.randomUUID(), role: 'user', content: message }
    setChatHistory(prev => [...prev, userMsg])
    setIsChatThinking(true)
    try {
      const context = buildTranscript(conversations)
      const historyForApi = chatHistory.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: modelId, message, history: historyForApi, context }),
      })
      const data = await res.json()
      const assistantMsg = { id: crypto.randomUUID(), role: 'assistant', content: data.content, modelId }
      setChatHistory(prev => [...prev, assistantMsg])
    } catch (err) {
      const errMsg = { id: crypto.randomUUID(), role: 'assistant', content: `Error: ${err.message}`, modelId: null }
      setChatHistory(prev => [...prev, errMsg])
    } finally {
      setIsChatThinking(false)
    }
  }, [conversations, chatHistory])

  // ── render ─────────────────────────────────────────────────────────────────
  const bg = 'bg-slate-50 dark:bg-[#0f1117]'
  const text = 'text-slate-800 dark:text-slate-200'

  return (
    <div className={`min-h-screen flex flex-col ${bg} ${text}`}>
      <NavBar mode={mode} onModeChange={setMode} theme={theme} onToggleTheme={toggleTheme} />

      {modelsError && (
        <div className="max-w-5xl mx-auto px-6 pt-4 w-full">
          <div className="rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 px-4 py-3 text-red-700 dark:text-red-300 text-sm">
            {modelsError}
          </div>
        </div>
      )}

      {mode === 'debate' && (
        <main className="max-w-5xl mx-auto px-6 py-8 space-y-8 w-full">
          <DebateForm models={models} onSubmit={startDebate} disabled={debateState === 'running'} />
          {(debateState || Object.keys(rounds).length > 0) && (
            <DebateResults rounds={rounds} status={status} currentRound={currentRound} debateState={debateState} progress={progress} />
          )}
        </main>
      )}

      {mode === 'roleplay' && (
        <RoleplayPage
          models={models}
          conversations={conversations}
          selectedConvId={selectedConvId}
          onSelectConv={setSelectedConvId}
          onStartRun={startRoleplay}
          onStop={stopRoleplay}
          chatHistory={chatHistory}
          onSendChat={sendChatMessage}
          isChatThinking={isChatThinking}
        />
      )}
    </div>
  )
}
