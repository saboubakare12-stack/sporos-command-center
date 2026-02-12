import { Router } from 'express';
import { Client } from '@notionhq/client';

const router = Router();

let notion = null;
let cachedDataSourceId = null;

function getNotion() {
  if (notion) return notion;
  if (!process.env.NOTION_API_KEY || process.env.NOTION_API_KEY === 'your_notion_api_key_here') {
    return null;
  }
  notion = new Client({ auth: process.env.NOTION_API_KEY });
  return notion;
}

// Resolve the data source ID from a database ID (Notion SDK v5 / API 2025-09-03)
async function getDataSourceId(client, dbId) {
  if (cachedDataSourceId) return cachedDataSourceId;
  const db = await client.databases.retrieve({ database_id: dbId });
  const ds = db.data_sources?.[0];
  if (!ds) throw new Error('No data sources found in database');
  cachedDataSourceId = ds.id;
  return cachedDataSourceId;
}

// GET /api/notion/content — Fetch content calendar from Notion
router.get('/content', async (_req, res) => {
  try {
    const client = getNotion();
    const dbId = process.env.NOTION_DATABASE_ID;

    if (!client || !dbId || dbId === 'your_notion_database_id_here') {
      return res.json(getDemoContent());
    }

    const dataSourceId = await getDataSourceId(client, dbId);

    const response = await client.dataSources.query({
      data_source_id: dataSourceId,
      sorts: [{ property: 'Date Scheduled', direction: 'ascending' }],
    });

    const content = response.results.map((page) => mapPage(page));

    res.json(content);
  } catch (err) {
    console.error('Error fetching Notion content:', err.message);
    res.json(getDemoContent());
  }
});

// Helper to extract title from Notion properties
function getTitle(props) {
  for (const key of Object.keys(props)) {
    if (props[key].type === 'title') {
      return props[key].title.map((t) => t.plain_text).join('') || 'Untitled';
    }
  }
  return 'Untitled';
}

function getSelect(props, name) {
  // Try exact name first, then case-insensitive search
  const prop = props[name] || Object.values(props).find(
    (p) => p.type === 'select' || p.type === 'status'
  );
  if (!prop) return '';
  if (prop.type === 'select') return prop.select?.name || '';
  if (prop.type === 'status') return prop.status?.name || '';
  return '';
}

function getDate(props, name) {
  const prop = props[name];
  if (!prop || prop.type !== 'date' || !prop.date) return '';
  return prop.date.start || '';
}

// Build Notion property object from our flat data
function buildNotionProperties(data) {
  const props = {};
  if (data.title !== undefined) {
    props['Post Title/Idea'] = { title: [{ text: { content: data.title } }] };
  }
  if (data.type !== undefined) {
    props['Type'] = { select: { name: data.type } };
  }
  if (data.status !== undefined) {
    props['Status'] = { status: { name: data.status } };
  }
  if (data.dateScheduled !== undefined) {
    props['Date Scheduled'] = { date: data.dateScheduled ? { start: data.dateScheduled } : null };
  }
  if (data.platforms !== undefined) {
    props['Platform'] = { multi_select: data.platforms.map((p) => ({ name: p })) };
  }
  if (data.script !== undefined) {
    props['Detailed content / instructions'] = {
      rich_text: [{ text: { content: data.script || '' } }],
    };
  }
  return props;
}

// Helper to map a Notion page to our content shape
function mapPage(page) {
  const props = page.properties;
  const detailProp = props['Detailed content / instructions'];
  const script = detailProp?.rich_text
    ? detailProp.rich_text.map((t) => t.plain_text).join('')
    : '';
  const platformProp = props['Platform'];
  const platforms = platformProp?.multi_select
    ? platformProp.multi_select.map((p) => p.name)
    : [];
  return {
    id: page.id,
    title: getTitle(props),
    type: getSelect(props, 'Type') || '',
    status: getSelect(props, 'Status') || 'Not started',
    dateScheduled: getDate(props, 'Date Scheduled'),
    platforms,
    script,
  };
}

// POST /api/notion/content — Create a new content page
router.post('/content', async (req, res) => {
  try {
    const client = getNotion();
    const dbId = process.env.NOTION_DATABASE_ID;
    if (!client || !dbId || dbId === 'your_notion_database_id_here') {
      return res.status(400).json({ error: 'Notion not configured' });
    }
    const dataSourceId = await getDataSourceId(client, dbId);
    const properties = buildNotionProperties(req.body);
    const page = await client.pages.create({
      parent: { database_id: dbId },
      data_source: dataSourceId,
      properties,
    });
    res.json(mapPage(page));
  } catch (err) {
    console.error('Error creating Notion page:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notion/content/:pageId — Update existing page
router.put('/content/:pageId', async (req, res) => {
  try {
    const client = getNotion();
    if (!client) return res.status(400).json({ error: 'Notion not configured' });
    const properties = buildNotionProperties(req.body);
    const page = await client.pages.update({
      page_id: req.params.pageId,
      properties,
    });
    res.json(mapPage(page));
  } catch (err) {
    console.error('Error updating Notion page:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notion/content/:pageId — Archive page
router.delete('/content/:pageId', async (req, res) => {
  try {
    const client = getNotion();
    if (!client) return res.status(400).json({ error: 'Notion not configured' });
    await client.pages.update({
      page_id: req.params.pageId,
      archived: true,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error archiving Notion page:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function getDemoContent() {
  return [
    { id: 1, title: '3 Things to Know This Week in Markets', type: 'Educational', status: 'Drafted', dateScheduled: '2026-02-14', platforms: ['Reels', 'LinkedIn'], script: '1. Markets reacting to latest Fed minutes\n2. Tech earnings season wrap-up\n3. Bond yields trending down — what it means for your portfolio' },
    { id: 2, title: 'Tax-Loss Harvesting Explained Simply', type: 'Educational', status: 'Not started', dateScheduled: '2026-02-18', platforms: ['Instagram', 'LinkedIn'], script: '' },
    { id: 3, title: 'Why I Love Dividend Aristocrats', type: 'Thought Leadership', status: 'Scheduled', dateScheduled: '2026-02-16', platforms: ['Reels'], script: 'Hook: "What if I told you there are companies that have raised dividends for 25+ years straight?"' },
    { id: 4, title: 'Client Spotlight: The Power of Starting Early', type: 'Personal Story', status: 'Needs Image', dateScheduled: '2026-02-20', platforms: ['Instagram', 'Facebook'], script: 'Graphic showing $500/mo invested at age 25 vs 35 vs 45' },
    { id: 5, title: 'Roth vs Traditional IRA in 2026', type: 'Educational', status: 'Drafted', dateScheduled: '2026-02-22', platforms: ['LinkedIn', 'Business Pages'], script: 'Slide 1: Title\nSlide 2: Roth basics\nSlide 3: Traditional\nSlide 4: Income limits\nSlide 5: Decision tree' },
    { id: 6, title: 'Market Volatility — Stay the Course', type: 'Thought Leadership', status: 'Not started', dateScheduled: '2026-02-25', platforms: ['Reels', 'LinkedIn'], script: '' },
  ];
}

export { router as notionRouter };
