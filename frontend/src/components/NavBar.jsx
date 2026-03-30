export default function NavBar({ mode, onModeChange, theme, onToggleTheme }) {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1117] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">⚔️ Athena</span>
        </div>

        {/* Mode tabs */}
        <nav className="flex items-center gap-1">
          {[
            { id: 'debate',   label: '🧠 Debate' },
            { id: 'roleplay', label: '🎭 Roleplay' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onModeChange(id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                mode === id
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
