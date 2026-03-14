const { dbGet, dbSet } = require('./_db');
const { getTokenFromReq, verifyAuthToken } = require('./_auth');

const MAX_UPLOADS_PER_DEVICE = 50;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-Id');
}

function jsonResponse(res, status, payload) {
  res.status(status).json(payload);
}

function listKey(scopeId) {
  return `scan2cook:recipe_uploads:${scopeId}`;
}

function fileKey(scopeId, uploadId) {
  return `scan2cook:recipe_upload:${scopeId}:${uploadId}`;
}

function makeUploadId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function saveRecipeUpload(scopeId, payload) {
  const fileName = String(payload?.fileName || 'recipe-upload').slice(0, 120);
  const mimeType = String(payload?.mimeType || 'application/octet-stream').slice(0, 80);
  const rawOcr = payload?.ocrData;

  if (!rawOcr || typeof rawOcr !== 'object') {
    throw new Error('Missing ocrData');
  }

  const ocrData = {
    title: String(rawOcr.title || 'Untitled Recipe').slice(0, 200),
    ingredients: Array.isArray(rawOcr.ingredients) ? rawOcr.ingredients.map((v) => String(v).slice(0, 200)) : [],
    instructions: Array.isArray(rawOcr.instructions) ? rawOcr.instructions.map((v) => String(v).slice(0, 500)) : [],
    notes: String(rawOcr.notes || '').slice(0, 4000),
  };

  const uploadId = makeUploadId();
  const uploadedAt = new Date().toISOString();

  const existing = (await dbGet(listKey(scopeId))) || [];
  const entry = {
    id: uploadId,
    fileName,
    mimeType,
    uploadedAt,
    ocrTitle: ocrData.title,
    ocrData,
  };

  const updated = [entry, ...existing].slice(0, MAX_UPLOADS_PER_DEVICE);
  await dbSet(listKey(scopeId), updated);
  await dbSet(fileKey(scopeId, uploadId), entry);

  return entry;
}

async function listRecipeUploads(scopeId) {
  const uploads = (await dbGet(listKey(scopeId))) || [];
  return uploads;
}

async function getRecipeUpload(scopeId, uploadId) {
  if (!uploadId) {
    throw new Error('Missing uploadId');
  }
  const upload = await dbGet(fileKey(scopeId, String(uploadId)));
  if (!upload) {
    throw new Error('Upload not found');
  }
  return upload;
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    jsonResponse(res, 405, { error: 'Method not allowed' });
    return;
  }

  const token = getTokenFromReq(req);
  const claims = verifyAuthToken(token);
  if (!claims?.userId) {
    jsonResponse(res, 401, { error: 'Please sign in first.' });
    return;
  }
  const scopeId = `user:${claims.userId}`;

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { action, payload } = body || {};

    if (action === 'saveRecipeUpload') {
      const data = await saveRecipeUpload(scopeId, payload);
      jsonResponse(res, 200, { data });
      return;
    }

    if (action === 'listRecipeUploads') {
      const data = await listRecipeUploads(scopeId);
      jsonResponse(res, 200, { data });
      return;
    }

    if (action === 'getRecipeUpload') {
      const data = await getRecipeUpload(scopeId, payload?.uploadId);
      jsonResponse(res, 200, { data });
      return;
    }

    jsonResponse(res, 400, { error: 'Unknown action' });
  } catch (error) {
    jsonResponse(res, 500, {
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};
