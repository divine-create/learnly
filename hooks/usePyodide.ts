'use client'
import { useRef, useState } from 'react'

declare global {
  interface Window { loadPyodide: (opts: { indexURL: string }) => Promise<any> }
}

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/'

export function usePyodide() {
  const pyodideRef = useRef<any>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  async function ensureLoaded() {
    if (pyodideRef.current) return pyodideRef.current

    setLoading(true)

    if (!document.querySelector('script[data-pyodide]')) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = `${PYODIDE_CDN}pyodide.js`
        script.dataset.pyodide = '1'
        script.onload = () => resolve()
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    const py = await window.loadPyodide({ indexURL: PYODIDE_CDN })
    pyodideRef.current = py
    setLoading(false)
    setReady(true)
    return py
  }

  async function runCode(code: string): Promise<{ stdout: string; stderr: string }> {
    const py = await ensureLoaded()

    let stdout = ''
    let stderr = ''

    py.setStdout({ batched: (s: string) => { stdout += s + '\n' } })
    py.setStderr({ batched: (s: string) => { stderr += s + '\n' } })

    try {
      await py.runPythonAsync(code)
    } catch (err: any) {
      stderr = err.message ?? String(err)
    }

    return { stdout: stdout.trim(), stderr: stderr.trim() }
  }

  return { runCode, loading, ready }
}
