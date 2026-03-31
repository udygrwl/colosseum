import { useTheme } from '../context/ThemeContext'

export default function NavBar({ mode, onModeChange }) {
  const { isDark, toggleTheme } = useTheme()

  const tabs = [
    { id: 'arena', label: 'Arena' },
    { id: 'roleplay', label: 'Roleplay' },
  ]

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1117] sticky top-0 z-50">
      <div className="max-w-full mx-auto px-6 py-3 flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Colosseum</span>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-lg p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onModeChange(tab.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === tab.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
      </div>
    </header>
  )
}
