import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { sheetsRouter } from './routes/sheets.js';
import { notionRouter } from './routes/notion.js';
import { marketRouter } from './routes/market.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/sheets', sheetsRouter);
app.use('/api/notion', notionRouter);
app.use('/api/market', marketRouter);

// Health check + env diagnostics (no secrets exposed)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      GOOGLE_SERVICE_ACCOUNT_KEY_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON ? 'SET' : 'NOT SET',
      GOOGLE_SHEET_ID_TASKS: process.env.GOOGLE_SHEET_ID_TASKS ? 'SET' : 'NOT SET',
      GOOGLE_SHEET_ID_TOUCHPOINTS: process.env.GOOGLE_SHEET_ID_TOUCHPOINTS ? 'SET' : 'NOT SET',
      GOOGLE_SHEET_ID_MARKET: process.env.GOOGLE_SHEET_ID_MARKET ? 'SET' : 'NOT SET',
      NOTION_API_KEY: process.env.NOTION_API_KEY ? 'SET' : 'NOT SET',
      NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID ? 'SET' : 'NOT SET',
    },
  });
});

// Temporary debug endpoint — test raw Google Sheets access
app.get('/api/debug/sheets', async (_req, res) => {
  try {
    const { google } = await import('googleapis');
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
    if (!keyJson) return res.json({ error: 'GOOGLE_SERVICE_ACCOUNT_KEY_JSON not set' });

    const credentials = JSON.parse(keyJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const sheetId = process.env.GOOGLE_SHEET_ID_TASKS;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Tasks!A1:I3',
    });

    res.json({
      ok: true,
      sheetId,
      rowCount: (response.data.values || []).length,
      headers: response.data.values?.[0] || [],
      sampleRow: response.data.values?.[1] || [],
    });
  } catch (err) {
    res.json({ error: err.message, code: err.code, stack: err.stack?.split('\n').slice(0, 3) });
  }
});

// --- Serve React frontend in production ---
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// All non-API routes fall through to React's index.html (SPA client-side routing)
app.get('*splat', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Sporos API] Server running on http://localhost:${PORT}`);
});
