// ============================================================
// utils/pinecone.js — Pinecone vector store for workMitra
// Embeddings via Gemini text-embedding-004 (free, 768 dims)
// ============================================================
const { Pinecone } = require('@pinecone-database/pinecone');

const PINECONE_API_KEY  = process.env.PINECONE_API_KEY;
const PINECONE_INDEX    = process.env.PINECONE_INDEX || 'workmitra-projects';
const GEMINI_API_KEY    = process.env.GEMINI_API_KEY;
const EMBED_MODEL       = 'text-embedding-004'; // 768 dims, free

let _index = null;

function getPineconeIndex() {
  if (!PINECONE_API_KEY) return null;
  if (_index) return _index;
  const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
  _index = pc.index(PINECONE_INDEX);
  return _index;
}

// ─── Embed text using Gemini text-embedding-004 ─────────────
async function embedText(text) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Gemini embed failed');
  return data.embedding.values; // float32[]
}

// ─── Build a rich text representation of a project ──────────
function projectToText(project) {
  return [
    project.title,
    project.description,
    `Skills: ${(project.requiredSkills || []).join(', ')}`,
    `Type: ${project.workType || ''}`,
    `Complexity: ${project.complexity || ''}`,
    `Duration: ${project.duration || ''}`,
  ].filter(Boolean).join('. ');
}

// ─── Build query text from a student's profile ──────────────
function studentToQueryText(user) {
  return [
    user.bio || '',
    user.targetSkills ? `Skills: ${user.targetSkills}` : '',
    user.projectType  ? `Track: ${user.projectType}`   : '',
    user.major        ? `Major: ${user.major}`          : '',
  ].filter(Boolean).join('. ');
}

// ─── Upsert a project into Pinecone (call on create/update) ─
async function upsertProject(project) {
  const index = getPineconeIndex();
  if (!index) {
    console.warn('[Pinecone] Skipping upsert — PINECONE_API_KEY not set.');
    return;
  }
  try {
    const text   = projectToText(project);
    const vector = await embedText(text);
    await index.upsert([{
      id:       project._id.toString(),
      values:   vector,
      metadata: {
        title:         project.title,
        companyId:     project.companyId?.toString() || '',
        workType:      project.workType || '',
        complexity:    project.complexity || '',
        budget:        project.budget || 0,
        requiredSkills: (project.requiredSkills || []).join(', '),
        status:        project.status || 'Published',
      },
    }]);
    console.log(`[Pinecone] Upserted project: ${project.title}`);
  } catch (err) {
    console.error('[Pinecone] Upsert failed:', err.message);
  }
}

// ─── Delete a project from Pinecone (call on delete/archive) ─
async function deleteProject(projectId) {
  const index = getPineconeIndex();
  if (!index) return;
  try {
    await index.deleteOne(projectId.toString());
  } catch (err) {
    console.error('[Pinecone] Delete failed:', err.message);
  }
}

// ─── Find top-N projects semantically matching a student ────
async function matchProjectsForStudent(user, topK = 5) {
  const index = getPineconeIndex();
  if (!index) return null; // null signals fallback to Gemini

  const queryText = studentToQueryText(user);
  if (!queryText.trim()) return null;

  try {
    const queryVector = await embedText(queryText);
    const results = await index.query({
      vector:          queryVector,
      topK,
      includeMetadata: true,
      filter:          { status: { $eq: 'Published' } },
    });

    return results.matches.map(m => ({
      projectId: m.id,
      score:     Math.round(m.score * 100),   // 0-100 similarity %
      metadata:  m.metadata,
    }));
  } catch (err) {
    console.error('[Pinecone] Match failed:', err.message);
    return null;
  }
}

// ─── Backfill all existing Published projects ────────────────
async function backfillAllProjects(Project) {
  const index = getPineconeIndex();
  if (!index) {
    console.warn('[Pinecone] Backfill skipped — PINECONE_API_KEY not set.');
    return 0;
  }
  const projects = await Project.find({ status: 'Published' });
  let count = 0;
  for (const p of projects) {
    await upsertProject(p);
    count++;
    // Small delay to avoid Gemini rate limits
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`[Pinecone] Backfill complete: ${count} projects indexed.`);
  return count;
}

module.exports = {
  upsertProject,
  deleteProject,
  matchProjectsForStudent,
  backfillAllProjects,
};
