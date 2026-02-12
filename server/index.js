import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { sheetsRouter } from './routes/sheets.js';
import { notionRouter } from './routes/notion.js';
import { marketRouter } from './routes/market.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/sheets', sheetsRouter);
app.use('/api/notion', notionRouter);
app.use('/api/market', marketRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[Sporos API] Server running on http://localhost:${PORT}`);
});
