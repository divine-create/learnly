import { GoogleGenerativeAI, TaskType } from '@google/generative-ai'
import { prisma } from '@/lib/db'

// Vector search for retrieved lesson material. Embeddings are produced by
// Gemini's text-embedding-004 model and stored as JSON arrays; similarity is
// computed in JS via cosine. When GEMINI_API_KEY is missing (e.g. local dev
// without a key) or the API call fails, we fall back to a deterministic
// TF-IDF embedding so the pipeline still works offline.
//
// In production this JS cosine scan is replaced by pgvector's <=> operator.

const EMBED_MODEL = 'text-embedding-004'
const apiKey = process.env.GEMINI_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  if (magA === 0 || magB === 0) return 0
  return dot / (magA * magB)
}

// Deterministic 64-dim TF-IDF-style fallback (no external API required).
function simpleEmbed(text: string): number[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
  const freq: Record<string, number> = {}
  words.forEach(w => { if (w) freq[w] = (freq[w] ?? 0) + 1 })

  const vec = new Array(64).fill(0)
  for (const [word, count] of Object.entries(freq)) {
    let hash = 0
    for (let i = 0; i < word.length; i++) {
      hash = (hash * 31 + word.charCodeAt(i)) & 0x7fffffff
    }
    vec[hash % 64] += count
  }

  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0))
  return mag > 0 ? vec.map(v => v / mag) : vec
}

/** Embed a batch of document chunks for storage. */
async function embedDocuments(texts: string[]): Promise<number[][]> {
  if (!genAI || texts.length === 0) return texts.map(simpleEmbed)
  try {
    const model = genAI.getGenerativeModel({ model: EMBED_MODEL })
    const result = await model.batchEmbedContents({
      requests: texts.map(text => ({
        content: { role: 'user', parts: [{ text }] },
        taskType: TaskType.RETRIEVAL_DOCUMENT,
      })),
    })
    return result.embeddings.map(e => e.values as number[])
  } catch (err) {
    console.error('Gemini document embedding failed; falling back to TF-IDF:', err)
    return texts.map(simpleEmbed)
  }
}

/** Embed a search query. Uses the RETRIEVAL_QUERY task type for asymmetric search. */
async function embedQuery(text: string): Promise<number[]> {
  if (!genAI) return simpleEmbed(text)
  try {
    const model = genAI.getGenerativeModel({ model: EMBED_MODEL })
    const result = await model.embedContent({
      content: { role: 'user', parts: [{ text }] },
      taskType: TaskType.RETRIEVAL_QUERY,
    })
    return result.embedding.values as number[]
  } catch (err) {
    console.error('Gemini query embedding failed; falling back to TF-IDF:', err)
    return simpleEmbed(text)
  }
}

export function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let i = 0
  while (i < words.length) {
    chunks.push(words.slice(i, i + chunkSize).join(' '))
    i += chunkSize - overlap
  }
  return chunks.filter(c => c.trim().length > 20)
}

export async function embedAndStoreChunks(
  materialId: string,
  text: string
): Promise<void> {
  const chunks = chunkText(text)

  await prisma.materialChunk.deleteMany({ where: { materialId } })

  const embeddings = await embedDocuments(chunks)
  const model = genAI ? EMBED_MODEL : 'tfidf'

  const records = chunks.map((chunkText, chunkIndex) => ({
    materialId,
    chunkText,
    chunkIndex,
    embedding: JSON.stringify(embeddings[chunkIndex] ?? []),
    metadata: JSON.stringify({ chunkIndex, length: chunkText.length, model }),
  }))

  await prisma.materialChunk.createMany({ data: records })

  await prisma.material.update({
    where: { id: materialId },
    data: { status: 'ready' },
  })
}

export async function retrieveRelevantChunks(
  query: string,
  lessonId: string,
  topK = 5
): Promise<string[]> {
  const queryVec = await embedQuery(query)

  const chunks = await prisma.materialChunk.findMany({
    where: {
      material: { lessonId },
    },
    select: { chunkText: true, embedding: true },
  })

  if (chunks.length === 0) return []

  const scored = chunks.map(chunk => {
    try {
      const vec = JSON.parse(chunk.embedding ?? '[]') as number[]
      const score = cosineSimilarity(queryVec, vec)
      return { text: chunk.chunkText, score }
    } catch {
      return { text: chunk.chunkText, score: 0 }
    }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(c => c.text)
}
