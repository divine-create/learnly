import fs from 'fs'
import path from 'path'

export async function extractTextFromFile(
  filePath: string,
  fileType: string
): Promise<string> {
  const fullPath = path.join(process.cwd(), 'public', filePath)

  try {
    if (fileType === 'txt') {
      return fs.readFileSync(fullPath, 'utf-8')
    }

    if (fileType === 'pdf') {
      // Dynamic import to avoid SSR issues
      const pdfParse = (await import('pdf-parse')).default
      const buffer = fs.readFileSync(fullPath)
      const data = await pdfParse(buffer)
      return data.text
    }

    if (fileType === 'docx') {
      const mammoth = await import('mammoth')
      const buffer = fs.readFileSync(fullPath)
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    }

    return ''
  } catch (err) {
    console.error('File parsing error:', err)
    return ''
  }
}

export function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    pdf: 'pdf', docx: 'docx', doc: 'docx',
    pptx: 'pptx', ppt: 'pptx',
    txt: 'txt', mp4: 'video', webm: 'video',
  }
  return map[ext] ?? 'txt'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
