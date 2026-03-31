import { useState, useEffect } from 'react'
import NavBar from './components/NavBar'
import DebateForm from './components/DebateForm'
import DebateResults from './components/DebateResults'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const ROUND_PROGRESS = { round0: 25, round1: 50, round2: 75, verdict: 100 }

export default function App() {
  // ── theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('athena-theme') || 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('athena-theme', theme)
  }, [theme])
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  // ── shared models ──────────────────────────────────────────────────────────
  const [models, setModels] = useState([])
  const [modelsError, setModelsError] = useState(null)
  useEffect(() => {
    fetch(`${API}/api/models`)
      .then(r => r.json())
      .then(d => setModels(d.models))
      .catch(() => setModelsError(`Could not reach backend at ${API}. Make sure the backend is running.`))
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

  // ── render ─────────────────────────────────────────────────────────────────
  const bg = 'bg-slate-50 dark:bg-[#0f1117]'
  const text = 'text-slate-800 dark:text-slate-200'

  return (
    <div className={`min-h-screen flex flex-col ${bg} ${text}`}>
      <NavBar theme={theme} onToggleTheme={toggleTheme} />

      {modelsError && (
        <div className="max-w-5xl mx-auto px-6 pt-4 w-full">
          <div className="rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 px-4 py-3 text-red-700 dark:text-red-300 text-sm">
            {modelsError}
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8 w-full">
        <DebateForm models={models} onSubmit={startDebate} disabled={debateState === 'running'} />
        {(debateState || Object.keys(rounds).length > 0) && (
          <DebateResults rounds={rounds} status={status} currentRound={currentRound} debateState={debateState} progress={progress} />
        )}
      </main>
    </div>
  )
}
