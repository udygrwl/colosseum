import { useState, useCallback } from 'react'
import { Send } from 'lucide-react'
import ArenaPanel from './ArenaPanel'
import API_BASE from '../config'

export default function ArenaMode({ models, onResponsesChange }) {
  const [prompt, setPrompt] = useState('')
  const [selectedModels, setSelectedModels] = useState({ anthropic: '', google: '', openai: '' })
  const [responses, setResponses] = useState({ anthropic: null, google: null, openai: null })
  const [loadingStates, setLoadingStates] = useState({ anthropic: false, google: false, openai: false })
  const [submittedPrompt, setSubmittedPrompt] = useState('')

  const providers = ['anthropic', 'google', 'openai']
  const providerLabels = { anthropic: 'Claude', google: 'Gemini', openai: 'GPT / O-series' }

  const modelsByProvider = {}
  providers.forEach(p => {
    modelsByProvider[p] = models.filter(m => m.provider === p)
  })

  // Auto-select first available model per provider
  const getSelectedModel = (provider) => {
    const id = selectedModels[provider]
    return models.find(m => m.id === id) || null
  }

  const callSingleModel = useCallback(async (modelId, promptText, provider) => {
    setLoadingStates(prev => ({ ...prev, [provider]: true }))
    try {
      const res = await fetch(`${API_BASE}/api/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: modelId, prompt: promptText }),
      })
      const data = await res.json()
      const content = data.content || data.detail || 'No response'
      setResponses(prev => {
        const next = { ...prev, [provider]: content }
        // Build context for overseer
        buildContext(next, promptText)
        return next
      })
    } catch (err) {
      setResponses(prev => {
        const next = { ...prev, [provider]: `Error: ${err.message}` }
        buildContext(next, promptText)
        return next
      })
    } finally {
      setLoadingStates(prev => ({ ...prev, [provider]: false }))
    }
  }, [models])

  const buildContext = (resps, promptText) => {
    const parts = [`User Prompt: ${promptText}`, '', '--- Arena Responses ---']
    providers.forEach(p => {
      const model = getModelForContext(p)
      if (model && resps[p]) {
        parts.push(`\n[${model.name}]:`)
        parts.push(resps[p])
      }
    })
    onResponsesChange(parts.join('\n'))
  }

  const getModelForContext = (provider) => {
    const id = selectedModels[provider]
    return models.find(m => m.id === id) || null
  }

  const handleSubmit = () => {
    if (!prompt.trim()) return
    const currentPrompt = prompt.trim()
    setSubmittedPrompt(currentPrompt)
    setResponses({ anthropic: null, google: null, openai: null })

    providers.forEach(provider => {
      const modelId = selectedModels[provider]
      if (modelId) {
        callSingleModel(modelId, currentPrompt, provider)
      }
    })
  }

  const handleRefresh = (provider) => {
    if (!submittedPrompt || !selectedModels[provider]) return
    setResponses(prev => ({ ...prev, [provider]: null }))
    callSingleModel(selectedModels[provider], submittedPrompt, provider)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-600"
  const anySelected = providers.some(p => selectedModels[p])

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Prompt input area */}
      <div className="flex-shrink-0">
        {/* Model selectors */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {providers.map(provider => (
            <div key={provider}>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">
                {providerLabels[provider]}
              </label>
              <select
                value={selectedModels[provider]}
                onChange={e => setSelectedModels(prev => ({ ...prev, [provider]: e.target.value }))}
                className={inputCls}
              >
                <option value="">None</option>
                {modelsByProvider[provider].map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Prompt textarea */}
        <div className="flex gap-2">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your prompt... (Cmd+Enter to submit)"
            rows={3}
            className={`${inputCls} resize-none flex-1`}
          />
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || !anySelected}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-end flex items-center gap-2"
          >
            <Send size={16} />
            Submit
          </button>
        </div>
      </div>

      {/* Response panels */}
      <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
        {providers.map(provider => {
          const model = getSelectedModel(provider)
          if (!model) {
            return (
              <div key={provider} className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <span className="text-sm text-slate-400 dark:text-slate-500">No model selected</span>
              </div>
            )
          }
          return (
            <ArenaPanel
              key={provider}
              model={model}
              content={responses[provider]}
              loading={loadingStates[provider]}
              onRefresh={() => handleRefresh(provider)}
            />
          )
        })}
      </div>
    </div>
  )
}
