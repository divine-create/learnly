'use client'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Play, RotateCcw, Copy, Check } from 'lucide-react'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false, loading: () => <div className="h-64 bg-gray-900 rounded-lg animate-pulse" /> })

interface Props {
  value: string
  onChange?: (val: string) => void
  language?: string
  readOnly?: boolean
  height?: string
  onRun?: (code: string) => void
}

export default function CodeEditor({ value, onChange, language = 'python', readOnly = false, height = '300px', onRun }: Props) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-400 text-xs ml-2 font-mono">{language}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copy} className="text-gray-400 hover:text-white p-1 rounded transition-colors">
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
          {onRun && (
            <button
              onClick={() => onRun(value)}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded font-medium transition-colors"
            >
              <Play size={12} /> Run
            </button>
          )}
        </div>
      </div>

      <MonacoEditor
        height={height}
        language={language}
        value={value}
        onChange={v => onChange?.(v ?? '')}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          padding: { top: 12, bottom: 12 },
          fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
          fontLigatures: true,
          automaticLayout: true,
        }}
      />
    </div>
  )
}
