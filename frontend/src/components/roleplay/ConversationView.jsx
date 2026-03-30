import { useEffect, useRef } from 'react'

const ACTOR_STYLES = [
  { bubble: 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40', name: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  { bubble: 'bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/40',         name: 'text-sky-700 dark:text-sky-400',    dot: 'bg-sky-500'   },
  { bubble: 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40', name: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
]

const END_LABELS = {
  ended:     { text: '— Scene complete —',         style: 'text-slate-500 dark:text-slate-400' },
  max_turns: { text: '— Max turns reached —',      style: 'text-slate-500 dark:text-slate-400' },
  stopped:   { text: '— Stopped —',                style: 'text-amber-600 dark:text-amber-400' },
  error:     { text: '— Error —',                  style: 'text-red-500' },
}

export default function ConversationView({ conversation, actorStyleMap }) {
  const bottomRef = useRef(null)
  const { turns, status, endReason, config } = conversation

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns.length])

  if (!turns.length && status === 'running') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          Generating first turn...
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {turns.map((turn) => {
        const actorIdx = actorStyleMap[turn.role] ?? 0
        const style = ACTOR_STYLES[actorIdx % ACTOR_STYLES.length]
        return (
          <div key={turn.turn_index} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`} />
              <span className={`text-xs font-semibold ${style.name}`}>{turn.role}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-600">{turn.model_name}</span>
            </div>
            <div className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed text-slate-800 dark:text-slate-200 ${style.bubble} ml-3`}>
              {turn.content}
            </div>
          </div>
        )
      })}

      {/* Running indicator */}
      {status === 'running' && turns.length > 0 && (
        <div className="flex items-center gap-2 ml-3 py-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">Thinking...</span>
        </div>
      )}

      {/* End label */}
      {status !== 'running' && endReason && (
        <div className={`text-center text-xs py-3 ${(END_LABELS[endReason] || END_LABELS.ended).style}`}>
          {(END_LABELS[endReason] || END_LABELS.ended).text}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
