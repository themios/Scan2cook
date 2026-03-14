# Receipt2Pantry

A React Native Expo app that scans grocery receipts with AI, manages your pantry inventory, tracks spending, and suggests recipes.

## Features

- **Receipt Scanning** — Take a photo; AI parses store, items, prices, and categories automatically.
- **Pantry Inventory** — Items grouped by category with color-coded expiry dates (red/yellow/green).
- **Recipe Suggestions** — AI suggests 3 recipes from whatever is currently in your pantry.
- **Expense Tracking** — Weekly and 6-month bar charts built with pure React Native Views; receipt history with itemized breakdown.
- **Demo Mode** — "Load Demo Data" button on the home screen lets you explore the app without scanning a real receipt.

---

## Setup

### 1. Install dependencies

```bash
cd /home/tim/Applications/YiannoulaGroceries
npm install
```

### 2. Configure app API URL

```bash
cp .env.example .env
```

Open `.env` and set your deployed backend URL:

```
EXPO_PUBLIC_API_BASE_URL=https://your-project.vercel.app
```

### 3. Run the app

```bash
# Expo Go (fastest — scan QR with the Expo Go app)
npm start

# iOS Simulator
npm run ios

# Android Emulator
npm run android
```

---

## Project Structure

```
app/
  _layout.tsx       Tab navigation root
  index.tsx         Home Dashboard
  scan.tsx          Receipt camera + review flow
  pantry.tsx        Pantry inventory with search
  recipes.tsx       AI recipe suggestions
  expenses.tsx      Spending charts + receipt history

components/
  PantryItem.tsx    Single pantry row (tap to edit, long-press for options)
  RecipeCard.tsx    Expandable recipe card with nutrition pills
  ExpenseChart.tsx  Pure RN bar chart (no library)
  ReceiptReview.tsx Receipt confirmation/editing UI

lib/
  types.ts          All TypeScript interfaces
  storage.ts        AsyncStorage CRUD helpers
  claude.ts         App API client (OCR + recipes)
  demo.ts           Sample data for demo mode
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK ~52 with TypeScript |
| Routing | Expo Router v4 (file-based) |
| Camera | expo-camera v16 |
| Image processing | expo-image-manipulator |
| Persistence | @react-native-async-storage/async-storage |
| AI | Groq API via Vercel serverless route |
| UI | React Native built-in + StyleSheet only |

---

## Notes

- The app requests camera permission on first visit to the Scan tab. If denied, a friendly prompt explains why and offers a "Not Now" option.
- All pantry and receipt data is stored locally on-device via AsyncStorage.
- Expiry dates are estimated automatically by category (e.g. Meat = 3 days, Grains = 180 days). You can edit them in the Pantry tab.
- The bar chart uses only `View` and `StyleSheet` — no third-party charting library is required.

---

## Vercel Setup (Groq)

This repo includes a Vercel serverless route at `api/ai.js`.

Set these environment variables in your Vercel project:

```
GROQ_API_KEY=your_groq_key
GROQ_RECIPE_MODEL=llama-3.3-70b-versatile
GROQ_RECEIPT_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
AUTH_JWT_SECRET=long-random-secret-string
```

For cloud recipe-file storage, add a Vercel KV (or Upstash Redis) integration and set:

```
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

If your integration only provides `kv_REDIS_URL`, the backend supports that value directly.

Recipe upload privacy/storage behavior:
- Original images/PDF files are used only transiently for OCR extraction.
- Database stores only extracted OCR recipe data + metadata (title, ingredients, instructions, notes).

Then deploy this repo to Vercel and update your local app `.env`:

```
EXPO_PUBLIC_API_BASE_URL=https://your-project.vercel.app
```
