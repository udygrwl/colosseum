import React from 'react'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-white/10 dark:border-white/10 border-slate-200 bg-dark-bg dark:bg-dark-bg bg-white flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">⚔</div>
        <span className="font-bold text-lg tracking-tight dark:text-dark-text text-slate-800">
          Colosseum
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
          multi-model roleplay arena
        </span>
      </div>
      <ThemeToggle />
    </header>
  )
}
