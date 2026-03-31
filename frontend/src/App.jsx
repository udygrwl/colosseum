import { useState, useEffect } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import NavBar from './components/NavBar'
import OverseerPanel from './components/OverseerPanel'
import ArenaMode from './components/ArenaMode'
import RoleplayMode from './components/RoleplayMode'
import API_BASE from './config'

function AppInner() {
  const [mode, setMode] = useState('arena')
  const [models, setModels] = useState([])
  const [overseerContext, setOverseerContext] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/api/models`)
      .then(r => r.json())
      .then(data => setModels(data.models || []))
      .catch(() => {})
  }, [])

  // Clear overseer context when switching modes
  const handleModeChange = (newMode) => {
    setMode(newMode)
    setOverseerContext('')
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#0f1117] overflow-hidden">
      <NavBar mode={mode} onModeChange={handleModeChange} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Overseer Panel */}
        <div className="w-[380px] flex-shrink-0 flex flex-col overflow-hidden">
          <OverseerPanel models={models} context={overseerContext} />
        </div>

        {/* Divider */}
        <div className="w-px bg-slate-200 dark:bg-slate-800 flex-shrink-0" />

        {/* Right: Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {mode === 'arena' ? (
            <ArenaMode models={models} onResponsesChange={setOverseerContext} />
          ) : (
            <RoleplayMode models={models} onTranscriptChange={setOverseerContext} />
          )}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}
