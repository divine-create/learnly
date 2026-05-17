'use client'
import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { formatFileSize } from '@/lib/fileParser'

interface Props {
  lessonId: string
  onUploaded?: () => void
}

type Status = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export default function FileUpload({ lessonId, onUploaded }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const allowed = ['pdf', 'docx', 'doc', 'txt', 'pptx']
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!allowed.includes(ext)) {
      toast.error('Supported formats: PDF, DOCX, PPTX, TXT')
      return
    }

    setFileName(file.name)
    setStatus('uploading')
    setProgress(0)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('lessonId', lessonId)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setStatus('processing')
      toast.success('File uploaded! AI is processing your materials…')

      // Poll for status
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        const r = await fetch(`/api/upload/status?materialId=${data.materialId}`)
        const d = await r.json()
        if (d.status === 'ready' || attempts > 30) {
          clearInterval(poll)
          setStatus('done')
          toast.success('Materials ready! AI tutor updated. ✅')
          onUploaded?.()
        } else if (d.status === 'failed') {
          clearInterval(poll)
          setStatus('error')
          toast.error('Processing failed. Try again.')
        }
      }, 2000)
    } catch (err: any) {
      setStatus('error')
      toast.error(err.message ?? 'Upload failed')
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const icon = {
    idle: <Upload size={32} className="text-gray-400" />,
    uploading: <Loader2 size={32} className="text-brand-500 animate-spin" />,
    processing: <Loader2 size={32} className="text-blue-500 animate-spin" />,
    done: <CheckCircle size={32} className="text-green-500" />,
    error: <AlertCircle size={32} className="text-red-500" />,
  }[status]

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => status === 'idle' && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          status === 'idle' ? 'cursor-pointer hover:border-brand-400 hover:bg-brand-50 border-gray-300' :
          status === 'done' ? 'border-green-300 bg-green-50' :
          status === 'error' ? 'border-red-300 bg-red-50' :
          'border-blue-300 bg-blue-50'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          {icon}
          {status === 'idle' && (
            <>
              <div className="text-gray-700 font-medium">Drop file here or click to browse</div>
              <div className="text-gray-400 text-sm">PDF, DOCX, PPTX, TXT · Max 20MB</div>
            </>
          )}
          {status === 'uploading' && <div className="text-brand-700 font-medium">Uploading {fileName}…</div>}
          {status === 'processing' && (
            <div>
              <div className="text-blue-700 font-medium">Processing with AI…</div>
              <div className="text-blue-500 text-sm mt-1">Extracting text and creating embeddings</div>
            </div>
          )}
          {status === 'done' && (
            <div>
              <div className="text-green-700 font-medium">{fileName}</div>
              <div className="text-green-600 text-sm mt-1">Ready! AI tutor has been updated.</div>
              <button onClick={() => { setStatus('idle'); setFileName('') }} className="mt-2 text-xs text-brand-600 underline">
                Upload another
              </button>
            </div>
          )}
          {status === 'error' && (
            <div>
              <div className="text-red-700 font-medium">Upload failed</div>
              <button onClick={() => setStatus('idle')} className="mt-2 text-xs text-brand-600 underline">Try again</button>
            </div>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.doc,.txt,.pptx,.ppt"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  )
}
