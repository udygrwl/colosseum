import React from 'react'
import { Plus, X } from 'lucide-react'

export default function ConversationTabs({ tabs, activeTab, onSelect, onAdd, onClose }) {
  return (
    <div className="flex items-center gap-1 px-4 pt-2 overflow-x-auto flex-shrink-0">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-sm cursor-pointer transition-colors whitespace-nowrap
            ${activeTab === tab.id
              ? 'bg-white dark:bg-dark-card border-t border-x border-slate-200 dark:border-white/10 text-slate-800 dark:text-dark-text font-medium'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }
          `}
        >
          <span>{tab.label}</span>
          {tabs.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(tab.id) }}
              className="hover:text-red-400 transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onAdd}
        className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 hover:bg-slate-100 text-slate-400 hover:text-accent transition-colors"
        title="New run"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
