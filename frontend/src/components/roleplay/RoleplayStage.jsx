import { useState } from 'react'
import RoleplayForm from './RoleplayForm'
import ConversationView from './ConversationView'

function buildActorStyleMap(actors) {
  const map = {}
  actors.forEach((a, i) => { map[a.role] = i })
  return map
}

export default function RoleplayStage({
  models, conversations, selectedConvId, onSelectConv,
  onStartRun, onStop, isRunning,
}) {
  const [showForm, setShowForm] = useState(true)
  const selectedConv = conversations.find(c => c.id === selectedConvId)

  const handleStart = (config) => {
    setShowForm(false)
    onStartRun(config)
  }

  const handleRunAgain = () => {
    setShowForm(true)
  }

  const actorStyleMap = selectedConv ? buildActorStyleMap(selectedConv.config.actors) : {}

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      {conversations.length > 0 && (
        <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex-shrink-0">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => { onSelectConv(conv.id); setShowForm(false) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium whitespace-nowrap transition-colors border-t border-l border-r ${
                conv.id === selectedConvId
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 -mb-px pb-2'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {conv.status === 'running' && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                </span>
              )}
              {conv.status === 'done'    && <span className="text-emerald-500 text-[10px]">✓</span>}
              {conv.status === 'stopped' && <span className="text-slate-400 text-[10px]">■</span>}
              {conv.status === 'error'   && <span className="text-red-500 text-[10px]">✕</span>}
              {conv.label}
            </button>
          ))}
          <button
            onClick={() => { setShowForm(true); onSelectConv(null) }}
            className="px-3 py-1.5 rounded-t-lg text-xs text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors ml-1 whitespace-nowrap border border-transparent"
          >
            + New Run
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Form panel */}
        {(showForm || conversations.length === 0) && (
          <div className="border-b border-slate-200 dark:border-slate-800 overflow-y-auto flex-shrink-0 max-h-[55%]">
            <RoleplayForm
              models={models}
              onSubmit={handleStart}
              disabled={isRunning}
            />
          </div>
        )}

        {/* Conversation */}
        {selectedConv && !showForm && (
          <>
            {/* Scenario header */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 flex-shrink-0">
              <span className="text-xs text-slate-500 dark:text-slate-500 truncate flex-1">
                <span className="font-medium text-slate-600 dark:text-slate-400">Scene: </span>
                {selectedConv.config.scenario}
              </span>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                {selectedConv.config.actors.map((a, i) => (
                  <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    i === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                    i === 1 ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400' :
                              'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {a.role}
                  </span>
                ))}
              </div>
            </div>

            <ConversationView conversation={selectedConv} actorStyleMap={actorStyleMap} />
          </>
        )}

        {/* Empty state */}
        {!selectedConv && !showForm && (
          <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm">
            Select a run above or start a new one.
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          {selectedConv && (
            <span className="text-xs text-slate-500 dark:text-slate-500">
              {selectedConv.turns.length} turns
              {selectedConv.status !== 'running' && ` · ${selectedConv.status}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedConv && selectedConv.status !== 'running' && (
            <button
              onClick={handleRunAgain}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-amber-400 dark:hover:border-amber-600 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              ↺ Run Again
            </button>
          )}
          {isRunning && (
            <button
              onClick={onStop}
              className="text-xs px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
            >
              ■ Stop
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
