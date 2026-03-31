import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-colors hover:bg-white/10 text-dark-text dark:text-dark-text text-slate-700"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={18} className="text-accent" /> : <Moon size={18} />}
    </button>
  )
}
