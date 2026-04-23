import { useState } from 'react'
import { useTaskStore } from '../store/tasks'

export function PromptModal() {
  const { promptConfig, resolvePrompt } = useTaskStore()
  const [value, setValue] = useState('')

  if (!promptConfig) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-sm p-4 border border-gray-700 shadow-xl">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">{promptConfig.title}</h3>
        <input
          autoFocus
          className="w-full bg-gray-800 text-gray-200 text-sm rounded px-3 py-2 border border-gray-600 outline-none focus:border-indigo-500 mb-4"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') resolvePrompt(value)
            if (e.key === 'Escape') resolvePrompt(null)
          }}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => resolvePrompt(null)}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => resolvePrompt(value)}
            className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}
