import { prisma } from '@/lib/db'

// Simple cosine similarity for SQLite-based vector search
// In production, replace with pgvector's <=> operator
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dot / (magA * magB)
}

// TF-IDF inspired embedding (no external API required for MVP)
// Returns a 64-dim sparse vector based on term frequency
function simpleEmbed(text: string): number[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
  const freq: Record<string, number> = {}
  words.forEach(w => { if (w) freq[w] = (freq[w] ?? 0) + 1 })

  // Fixed 64-dim vector using hash bucketing
  const vec = new Array(64).fill(0)
  for (const [word, count] of Object.entries(freq)) {
    let hash = 0
    for (let i = 0; i < word.length; i++) {
      hash = (hash * 31 + word.charCodeAt(i)) & 0x7fffffff
    }
    vec[hash % 64] += count
  }

  // Normalize
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0))
  return mag > 0 ? vec.map(v => v / mag) : vec
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

  const records = chunks.map((chunkText, chunkIndex) => ({
    materialId,
    chunkText,
    chunkIndex,
    embedding: JSON.stringify(simpleEmbed(chunkText)),
    metadata: JSON.stringify({ chunkIndex, length: chunkText.length }),
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
  const queryVec = simpleEmbed(query)

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
      const score = vec.length > 0 ? cosineSimilarity(queryVec, vec) : 0
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
