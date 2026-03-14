const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DEFAULT_RECIPE_MODEL = process.env.GROQ_RECIPE_MODEL || 'llama-3.3-70b-versatile';
const DEFAULT_RECEIPT_MODEL =
  process.env.GROQ_RECEIPT_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function cleanJsonText(text) {
  return text.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
}

function jsonResponse(res, status, payload) {
  res.status(status).json(payload);
}

async function callGroq(body) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Server is missing GROQ_API_KEY.');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error ${response.status}: ${text}`);
  }

  return response.json();
}

async function parseReceipt(base64Image) {
  const prompt =
    'Parse this grocery receipt. Return ONLY valid JSON with this exact structure, no markdown, no code fences: ' +
    '{"store":"string","date":"YYYY-MM-DD","items":[{"name":"string","quantity":"string","price":number,"category":"Fruit|Vegetables|Meat|Dairy|Grains|Frozen|Snacks|Beverages|Other"}],"total":number,"tax":number}. ' +
    "Normalize abbreviated item names (e.g. CHK BRST -> Chicken Breast). Estimate category for each item. If date is unclear use today's date.";

  const result = await callGroq({
    model: DEFAULT_RECEIPT_MODEL,
    temperature: 0.1,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
  });

  const text = result?.choices?.[0]?.message?.content;
  if (!text || typeof text !== 'string') {
    throw new Error('Groq returned an empty receipt response.');
  }

  return JSON.parse(cleanJsonText(text));
}

async function suggestRecipes(pantryItems) {
  const itemList = pantryItems.map((i) => i.name).join(', ');

  const result = await callGroq({
    model: DEFAULT_RECIPE_MODEL,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content:
          `I have these pantry items: ${itemList}. Suggest 3 recipes I can make. Return ONLY valid JSON array, no markdown, no code fences: ` +
          '[{"id":"unique-string","name":"string","ingredients":["string"],"instructions":["string"],"nutrition":{"calories":number,"protein":number,"fat":number,"carbs":number,"fiber":number}}]',
      },
    ],
  });

  const text = result?.choices?.[0]?.message?.content;
  if (!text || typeof text !== 'string') {
    throw new Error('Groq returned an empty recipe response.');
  }

  return JSON.parse(cleanJsonText(text));
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

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { action, payload } = body || {};

    if (action === 'parseReceipt') {
      if (!payload?.base64Image) {
        jsonResponse(res, 400, { error: 'Missing payload.base64Image' });
        return;
      }

      const data = await parseReceipt(payload.base64Image);
      jsonResponse(res, 200, { data });
      return;
    }

    if (action === 'suggestRecipes') {
      if (!Array.isArray(payload?.pantryItems)) {
        jsonResponse(res, 400, { error: 'Missing payload.pantryItems[]' });
        return;
      }

      const data = await suggestRecipes(payload.pantryItems);
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
