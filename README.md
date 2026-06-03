# CodeBridge Nigeria

AI-powered K-12 coding education platform for Nigerian schools. Next.js 14
(App Router), Prisma, PostgreSQL + pgvector, NextAuth, and Google Gemini.

## Prerequisites

- Node.js 20+
- Docker (for the local PostgreSQL + pgvector database)

## Setup

```bash
cp .env.example .env   # then fill in the secrets (Gemini, Resend, Paystack)
npm run setup          # installs deps, starts Postgres, runs migrations, seeds
npm run dev
```

`npm run setup` runs: `npm install` → `docker compose up -d` → `prisma generate`
→ `prisma migrate deploy` → seed.

The database runs in the `learnly-postgres` container on host port **5433**
(to avoid clashing with any other local Postgres on 5432). Connection string
lives in `DATABASE_URL` (see `.env.example`).

### Demo accounts (after seeding)

| Role         | Email                    | Password   |
|--------------|--------------------------|------------|
| Super Admin  | super@codebridge.ng      | super123   |
| School Admin | admin@greenfield.ng      | admin123   |
| Teacher      | teacher@greenfield.ng    | teacher123 |
| Student      | student@greenfield.ng    | student123 |
| Parent       | parent@gmail.com         | parent123  |

## Database workflow

- Edit `prisma/schema.prisma`, then create a migration with
  `npm run db:migrate:dev` (interactive) or apply existing ones with
  `npm run db:migrate` (`prisma migrate deploy`).
- `npm run db:studio` opens Prisma Studio.

## RAG / embeddings

Lesson materials are chunked and embedded with Gemini `text-embedding-004`
(768-dim) and stored in a pgvector column; retrieval uses the `<=>` cosine
operator. Without `GEMINI_API_KEY` the pipeline falls back to a deterministic
TF-IDF embedding so it still works offline.
