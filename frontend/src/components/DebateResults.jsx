import RoundPanel from './RoundPanel'

const ROUNDS = [
  { key: 'round0',  label: 'Round 0 — Initial Positions', border: 'border-blue-300 dark:border-blue-700/50',   badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',     icon: '💬' },
  { key: 'round1',  label: 'Round 1 — Critiques',         border: 'border-orange-300 dark:border-orange-700/50', badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300', icon: '🔍' },
  { key: 'round2',  label: 'Round 2 — Revised Positions', border: 'border-green-300 dark:border-green-700/50',  badge: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',   icon: '✏️' },
  { key: 'verdict', label: 'Final Verdict',               border: 'border-purple-300 dark:border-purple-700/50', badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300', icon: '⚖️' },
]

const STEPS = ['Initial Positions', 'Critiques', 'Revisions', 'Verdict']

export default function DebateResults({ rounds, status, currentRound, debateState, progress }) {
  const completedRounds = ROUNDS.filter(r => rounds[r.key])
  const orderedRounds = [...completedRounds].reverse()

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-slate-600 dark:text-slate-400">Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="flex items-center gap-1">
          {STEPS.map((step, i) => {
            const threshold = (i + 1) * 25
            const isDone = progress >= threshold
            const isActive = !isDone && currentRound === i
            return (
              <div key={step} className="flex items-center flex-1 gap-1">
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full h-1.5 rounded-full transition-all duration-500 ${isDone ? 'bg-amber-500' : isActive ? 'bg-amber-300 dark:bg-amber-400/50' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  <span className={`text-[10px] hidden sm:block ${isDone ? 'text-amber-600 dark:text-amber-400' : isActive ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'}`}>
                    {step}
                  </span>
                </div>
                {i < STEPS.length - 1 && <div className="w-1" />}
              </div>
            )
          })}
        </div>
        {status && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400">{status}</span>
          </div>
        )}
        {debateState === 'done' && (
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-xs">✓</span>
            <span className="text-xs text-green-600 dark:text-green-400">Debate complete</span>
          </div>
        )}
      </div>

      {debateState === 'error' && (
        <div className="rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 px-4 py-3 text-red-700 dark:text-red-300 text-sm">
          {status}
        </div>
      )}

      {orderedRounds.map(r => (
        <RoundPanel
          key={r.key}
          roundKey={r.key}
          label={r.label}
          icon={r.icon}
          data={rounds[r.key]}
          borderColor={r.border}
          badgeStyle={r.badge}
        />
      ))}
    </div>
  )
}
