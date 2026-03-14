const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const pdfParse = require('pdf-parse');

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

async function parseReceiptText(receiptText) {
  const prompt =
    'Extract grocery receipt data from this text. Return ONLY valid JSON with this exact structure, no markdown, no code fences: ' +
    '{"store":"string","date":"YYYY-MM-DD","items":[{"name":"string","quantity":"string","price":number,"category":"Fruit|Vegetables|Meat|Dairy|Grains|Frozen|Snacks|Beverages|Other"}],"total":number,"tax":number}. ' +
    "Normalize abbreviated item names and infer missing category or quantity where possible. If date is unclear use today's date.";

  const result = await callGroq({
    model: DEFAULT_RECEIPT_MODEL,
    temperature: 0.1,
    messages: [
      {
        role: 'user',
        content: `${prompt}\n\nReceipt text:\n${receiptText}`,
      },
    ],
  });

  const text = result?.choices?.[0]?.message?.content;
  if (!text || typeof text !== 'string') {
    throw new Error('Groq returned an empty receipt text response.');
  }

  return JSON.parse(cleanJsonText(text));
}

async function parseReceiptPdf(base64Pdf) {
  const pdfBuffer = Buffer.from(base64Pdf, 'base64');
  const parsed = await pdfParse(pdfBuffer);
  const extractedText = parsed?.text?.trim();

  if (!extractedText) {
    throw new Error('Could not extract text from PDF receipt.');
  }

  return parseReceiptText(extractedText);
}

async function suggestRecipes(pantryItems, preferences = {}) {
  const itemList = pantryItems.map((i) => i.name).join(', ') || 'None';
  const cuisineText = preferences.cuisine && preferences.cuisine !== 'Any'
    ? preferences.cuisine
    : 'Any';
  const mainIngredients = Array.isArray(preferences.mainIngredients)
    ? preferences.mainIngredients
    : [];
  const mainIngredientsText = mainIngredients.length > 0
    ? mainIngredients.join(', ')
    : 'None specified';

  const result = await callGroq({
    model: DEFAULT_RECIPE_MODEL,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content:
          `I have these pantry items: ${itemList}. ` +
          `Preferred cuisine: ${cuisineText}. ` +
          `Main ingredients to prioritize: ${mainIngredientsText}. ` +
          'Suggest 3 practical recipes. Use pantry items first, and include minimal extra items if needed. ' +
          'If a cuisine is provided, keep all recipes in that cuisine style. ' +
          'Return ONLY valid JSON array, no markdown, no code fences, in this exact shape: ' +
          '[{"id":"unique-string","name":"string","cuisine":"string","ingredients":["string"],"instructions":["string"],"nutrition":{"calories":number,"protein":number,"fat":number,"carbs":number,"fiber":number}}]',
      },
    ],
  });

  const text = result?.choices?.[0]?.message?.content;
  if (!text || typeof text !== 'string') {
    throw new Error('Groq returned an empty recipe response.');
  }

  return JSON.parse(cleanJsonText(text));
}

async function suggestRecipesFromPhoto(base64Image, pantryItems, preferences = {}) {
  const pantryList = Array.isArray(pantryItems)
    ? pantryItems.map((i) => i.name).join(', ') || 'None'
    : 'None';
  const cuisineText = preferences.cuisine && preferences.cuisine !== 'Any'
    ? preferences.cuisine
    : 'Any';
  const mainIngredients = Array.isArray(preferences.mainIngredients)
    ? preferences.mainIngredients
    : [];
  const mainIngredientsText = mainIngredients.length > 0
    ? mainIngredients.join(', ')
    : 'None specified';

  const result = await callGroq({
    model: DEFAULT_RECIPE_MODEL,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              'Analyze this food image and identify visible ingredients. ' +
              `Also consider pantry items: ${pantryList}. ` +
              `Preferred cuisine: ${cuisineText}. ` +
              `Main ingredients to prioritize: ${mainIngredientsText}. ` +
              'Suggest 3 practical recipes based on detected items + pantry context. ' +
              'If a cuisine is provided, keep recipes in that cuisine style. ' +
              'Return ONLY valid JSON array, no markdown, no code fences, in this exact shape: ' +
              '[{"id":"unique-string","name":"string","cuisine":"string","ingredients":["string"],"instructions":["string"],"nutrition":{"calories":number,"protein":number,"fat":number,"carbs":number,"fiber":number}}]',
          },
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
    throw new Error('Groq returned an empty recipe-from-photo response.');
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

    if (action === 'parseReceiptPdf') {
      if (!payload?.base64Pdf) {
        jsonResponse(res, 400, { error: 'Missing payload.base64Pdf' });
        return;
      }

      const data = await parseReceiptPdf(payload.base64Pdf);
      jsonResponse(res, 200, { data });
      return;
    }

    if (action === 'suggestRecipes') {
      if (!Array.isArray(payload?.pantryItems)) {
        jsonResponse(res, 400, { error: 'Missing payload.pantryItems[]' });
        return;
      }

      const data = await suggestRecipes(payload.pantryItems, payload.preferences);
      jsonResponse(res, 200, { data });
      return;
    }

    if (action === 'suggestRecipesFromPhoto') {
      if (!payload?.base64Image) {
        jsonResponse(res, 400, { error: 'Missing payload.base64Image' });
        return;
      }

      const pantryItems = Array.isArray(payload?.pantryItems) ? payload.pantryItems : [];
      const data = await suggestRecipesFromPhoto(
        payload.base64Image,
        pantryItems,
        payload.preferences
      );
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
