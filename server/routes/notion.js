import { Router } from 'express';
import { Client } from '@notionhq/client';

const router = Router();

let notion = null;

function getNotion() {
  if (notion) return notion;
  if (!process.env.NOTION_API_KEY || process.env.NOTION_API_KEY === 'your_notion_api_key_here') {
    return null;
  }
  notion = new Client({ auth: process.env.NOTION_API_KEY });
  return notion;
}

// GET /api/notion/content — Fetch content calendar from Notion
router.get('/content', async (_req, res) => {
  try {
    const client = getNotion();
    const dbId = process.env.NOTION_DATABASE_ID;

    if (!client || !dbId || dbId === 'your_notion_database_id_here') {
      return res.json(getDemoContent());
    }

    const response = await client.databases.query({
      database_id: dbId,
      sorts: [{ property: 'Publish Date', direction: 'ascending' }],
    });

    const content = await Promise.all(
      response.results.map(async (page, i) => {
        const props = page.properties;
        let script = '';

        // Try to fetch page content for the script/outline
        try {
          const blocks = await client.blocks.children.list({ block_id: page.id, page_size: 20 });
          script = blocks.results
            .filter((b) => b.type === 'paragraph' || b.type === 'bulleted_list_item' || b.type === 'numbered_list_item')
            .map((b) => {
              const textArr = b[b.type]?.rich_text || [];
              return textArr.map((t) => t.plain_text).join('');
            })
            .filter(Boolean)
            .join('\n');
        } catch (_) {
          // If we can't fetch blocks, leave script empty
        }

        return {
          id: page.id || i + 1,
          title: getTitle(props),
          type: getSelect(props, 'Type') || 'Reel',
          status: getSelect(props, 'Status') || 'Idea',
          filmDate: getDate(props, 'Film Date'),
          publishDate: getDate(props, 'Publish Date'),
          script,
        };
      })
    );

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

function getDemoContent() {
  return [
    { id: 1, title: '3 Things to Know This Week in Markets', type: 'Reel', status: 'Script Ready', filmDate: '2026-02-13', publishDate: '2026-02-14', script: '1. Markets reacting to latest Fed minutes\n2. Tech earnings season wrap-up\n3. Bond yields trending down — what it means for your portfolio' },
    { id: 2, title: 'Tax-Loss Harvesting Explained Simply', type: 'Carousel', status: 'Idea', filmDate: '', publishDate: '2026-02-18', script: '' },
    { id: 3, title: 'Why I Love Dividend Aristocrats', type: 'Reel', status: 'Filmed', filmDate: '2026-02-10', publishDate: '2026-02-16', script: 'Hook: "What if I told you there are companies that have raised dividends for 25+ years straight?"\n\nBody:\n- Define Dividend Aristocrats\n- Show 3 examples with yield data\n- Explain compounding effect\n\nCTA: "Follow for more wealth-building insights"' },
    { id: 4, title: 'Client Spotlight: The Power of Starting Early', type: 'Static Post', status: 'In Design', filmDate: '', publishDate: '2026-02-20', script: 'Graphic showing $500/mo invested at age 25 vs 35 vs 45\nCaption: Real impact of time in the market' },
    { id: 5, title: 'Roth vs Traditional IRA in 2026', type: 'Carousel', status: 'Script Ready', filmDate: '', publishDate: '2026-02-22', script: 'Slide 1: Title\nSlide 2: Roth basics — pay tax now, grow tax-free\nSlide 3: Traditional — deduct now, pay tax later\nSlide 4: Income limits for 2026\nSlide 5: Which is right for you? (decision tree)\nSlide 6: CTA' },
    { id: 6, title: 'Market Volatility — Stay the Course', type: 'Reel', status: 'Idea', filmDate: '', publishDate: '2026-02-25', script: '' },
  ];
}

export { router as notionRouter };
