'use client'
import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react'
import Papa from 'papaparse'

type PreviewRow = { name: string; email: string; gradeLevel: string; password?: string }

export default function BulkImportPage() {
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data as PreviewRow[]
        setPreview(rows.slice(0, 100))
        if (rows.length > 100) toast(`Showing first 100 of ${rows.length} rows`)
      },
      error: () => toast.error('Could not parse CSV'),
    })
  }

  async function doImport() {
    if (preview.length === 0) return
    setImporting(true)
    const res = await fetch('/api/admin/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: preview }),
    })
    const data = await res.json()
    setImporting(false)
    setResult(data)
    if (data.created > 0) toast.success(`${data.created} students imported!`)
    if (data.skipped > 0) toast(`${data.skipped} skipped (already registered)`)
  }

  function downloadTemplate() {
    const csv = 'name,email,gradeLevel,password\nChidi Okafor,chidi@greenfield.ng,JSS 2,student123\nAmaka Eze,amaka@greenfield.ng,Primary 6,student123'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'students-template.csv'; a.click()
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
          <FileSpreadsheet size={22} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Student Import</h1>
          <p className="text-gray-500 text-sm">Upload a CSV to add many students at once</p>
        </div>
      </div>

      {/* Template download */}
      <div className="card bg-blue-50 border-blue-200 mb-6 flex items-center justify-between">
        <div>
          <div className="font-semibold text-blue-800">Step 1: Download the CSV template</div>
          <div className="text-blue-600 text-sm mt-0.5">Required columns: name, email, gradeLevel (optional: password)</div>
        </div>
        <button onClick={downloadTemplate} className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Download size={16} /> Template
        </button>
      </div>

      {/* Upload */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]) }}
        onDragOver={e => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors mb-6"
      >
        <Upload size={36} className="mx-auto mb-3 text-gray-400" />
        <div className="font-medium text-gray-700">Drop your CSV here or click to browse</div>
        <div className="text-gray-400 text-sm mt-1">CSV files only · Max 100 students per import</div>
      </div>
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {/* Preview */}
      {preview.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Preview ({preview.length} students)</h2>
            <button onClick={doImport} disabled={importing} className="btn-primary flex items-center gap-2">
              {importing ? 'Importing…' : `Import ${preview.length} Students`}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 text-left"><th className="pb-2 font-medium text-gray-500">Name</th><th className="pb-2 font-medium text-gray-500">Email</th><th className="pb-2 font-medium text-gray-500">Grade</th></tr></thead>
              <tbody>
                {preview.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 text-gray-900">{row.name}</td>
                    <td className="py-2 text-gray-600">{row.email}</td>
                    <td className="py-2 text-gray-500">{row.gradeLevel}</td>
                  </tr>
                ))}
                {preview.length > 10 && <tr><td colSpan={3} className="py-2 text-gray-400 text-center">+{preview.length - 10} more rows…</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Import Results</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center bg-green-50 rounded-xl p-4"><div className="text-2xl font-bold text-green-700">{result.created}</div><div className="text-sm text-green-600">Created</div></div>
            <div className="text-center bg-yellow-50 rounded-xl p-4"><div className="text-2xl font-bold text-yellow-700">{result.skipped}</div><div className="text-sm text-yellow-600">Skipped</div></div>
            <div className="text-center bg-red-50 rounded-xl p-4"><div className="text-2xl font-bold text-red-700">{result.errors.length}</div><div className="text-sm text-red-600">Errors</div></div>
          </div>
          {result.errors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3">
              {result.errors.map((e, i) => <div key={i} className="text-red-700 text-xs">{e}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
