import { GoogleGenerativeAI, TaskType } from '@google/generative-ai'
import { prisma } from '@/lib/db'

// Vector search for retrieved lesson material. Embeddings are produced by
// Gemini's text-embedding-004 model (768 dimensions) and stored in a pgvector
// column; nearest-neighbour search uses pgvector's <=> cosine-distance
// operator. When GEMINI_API_KEY is missing (e.g. local dev without a key) or
// the API call fails, we fall back to a deterministic TF-IDF embedding — also
// projected into 768 dimensions so it fits the same column.

const EMBED_DIM = 768
const EMBED_MODEL = 'text-embedding-004'
const apiKey = process.env.GEMINI_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

// Deterministic TF-IDF-style fallback projected into EMBED_DIM dimensions.
function simpleEmbed(text: string): number[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
  const freq: Record<string, number> = {}
  words.forEach(w => { if (w) freq[w] = (freq[w] ?? 0) + 1 })

  const vec = new Array(EMBED_DIM).fill(0)
  for (const [word, count] of Object.entries(freq)) {
    let hash = 0
    for (let i = 0; i < word.length; i++) {
      hash = (hash * 31 + word.charCodeAt(i)) & 0x7fffffff
    }
    vec[hash % EMBED_DIM] += count
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

// pgvector literal, e.g. "[0.1,0.2,...]". Returns null for wrong-sized vectors.
function toVectorLiteral(vec: number[]): string | null {
  if (vec.length !== EMBED_DIM) return null
  return `[${vec.join(',')}]`
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

  // The `embedding` column is an Unsupported pgvector type, so it can't be set
  // through the typed client — insert the row, then set the vector via raw SQL.
  for (let i = 0; i < chunks.length; i++) {
    const row = await prisma.materialChunk.create({
      data: {
        materialId,
        chunkText: chunks[i],
        chunkIndex: i,
        metadata: JSON.stringify({ chunkIndex: i, length: chunks[i].length, model }),
      },
      select: { id: true },
    })
    const literal = toVectorLiteral(embeddings[i] ?? [])
    if (literal) {
      await prisma.$executeRaw`UPDATE "MaterialChunk" SET embedding = ${literal}::vector WHERE id = ${row.id}`
    }
  }

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
  const literal = toVectorLiteral(await embedQuery(query))
  if (!literal) return []

  const rows = await prisma.$queryRaw<{ chunkText: string }[]>`
    SELECT mc."chunkText"
    FROM "MaterialChunk" mc
    JOIN "Material" m ON m.id = mc."materialId"
    WHERE m."lessonId" = ${lessonId} AND mc.embedding IS NOT NULL
    ORDER BY mc.embedding <=> ${literal}::vector
    LIMIT ${topK}
  `
  return rows.map(r => r.chunkText)
}
