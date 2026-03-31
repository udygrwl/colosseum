import React, { useState, useEffect } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import Header from './components/Header'
import AnalysisPanel from './components/AnalysisPanel'
import RoleplayStage from './components/RoleplayStage'
import API_BASE from './config'

function AppInner() {
  const [models, setModels] = useState([])
  const [transcript, setTranscript] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/api/models`)
      .then(r => r.json())
      .then(data => setModels(data.models || []))
      .catch(() => {})
  }, [])

  const handleTranscriptChange = (text) => {
    setTranscript(text)
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-dark-bg overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Analysis Panel */}
        <div className="w-[380px] flex-shrink-0 flex flex-col overflow-hidden">
          <AnalysisPanel models={models} transcript={transcript} />
        </div>

        {/* Divider */}
        <div className="w-px bg-slate-200 dark:bg-white/10 flex-shrink-0" />

        {/* Right: Roleplay Stage */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <RoleplayStage models={models} onTranscriptChange={handleTranscriptChange} />
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
