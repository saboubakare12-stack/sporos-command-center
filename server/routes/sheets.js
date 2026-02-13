import { Router } from 'express';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// Initialize Google Sheets client
let sheets = null;

function getSheets() {
  if (sheets) return sheets;

  let auth;

  // Option 1: Credentials as JSON string in env var (for Render / cloud hosting)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } catch (err) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY_JSON:', err.message);
      return null;
    }
  } else {
    // Option 2: Credentials as a file path (for local development)
    const keyFilePath = path.resolve(
      __dirname,
      '..',
      '..',
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || './credentials.json'
    );

    if (!fs.existsSync(keyFilePath)) {
      return null;
    }

    auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

// GET /api/sheets/tasks — Fetch tasks from Google Sheet
// Sheet tab "Tasks" — columns: Task | Project | Category | Status | Due Date | Days to Complete | Priority | Notes | Top Task
router.get('/tasks', async (_req, res) => {
  try {
    const client = getSheets();
    if (!client) {
      console.warn('[Tasks] Sheets client not available — serving demo data');
      return res.json(getDemoTasks());
    }

    const sheetId = process.env.GOOGLE_SHEET_ID_TASKS;
    if (!sheetId || sheetId === 'your_task_sheet_id_here') {
      console.warn('[Tasks] GOOGLE_SHEET_ID_TASKS not configured — serving demo data');
      return res.json(getDemoTasks());
    }

    const response = await client.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Tasks!A:I',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return res.json([]);

    const headers = rows[0].map((h) => h.toLowerCase().trim());
    const taskIdx = headers.indexOf('task');
    const projectIdx = headers.indexOf('project');
    const categoryIdx = headers.indexOf('category');
    const statusIdx = headers.indexOf('status');
    const dueDateIdx = headers.indexOf('due date');
    const priorityIdx = headers.indexOf('priority');
    const notesIdx = headers.indexOf('notes');
    const topTaskIdx = headers.indexOf('top task');

    const tasks = [];

    for (let i = 0; i < rows.length - 1; i++) {
      const row = rows[i + 1]; // skip header
      const sheetRow = i + 2; // 1-indexed, row 1 = header

      const task = (row[taskIdx !== -1 ? taskIdx : 0] || '').trim();
      const status = (row[statusIdx !== -1 ? statusIdx : 3] || '').trim();

      // Skip empty rows or rows without a task name
      if (!task) continue;
      // Skip rows without a recognized status
      if (!['To Do', 'In Progress', 'Done'].includes(status)) continue;

      const dueDateStr = (row[dueDateIdx !== -1 ? dueDateIdx : 4] || '').trim();
      let dueDate = null;
      if (dueDateStr) {
        const parts = dueDateStr.split('/');
        if (parts.length === 3) {
          // M/D/YYYY, MM/DD/YYYY, or M/D/YY
          const [m, d, rawY] = parts;
          const y = rawY.length <= 2 ? `20${rawY.padStart(2, '0')}` : rawY;
          dueDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        } else if (parts.length === 2) {
          // M/D without year — assume current year
          const [m, d] = parts;
          const y = new Date().getFullYear();
          dueDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        } else {
          // Try parsing other date formats (e.g. "Feb 12, 2026")
          const parsed = new Date(dueDateStr);
          if (!isNaN(parsed.getTime())) {
            dueDate = parsed.toISOString().split('T')[0];
          }
        }
      }

      const topTaskVal = (row[topTaskIdx !== -1 ? topTaskIdx : 8] || '').trim().toUpperCase();

      tasks.push({
        id: sheetRow,
        sheetRow,
        task,
        project: (row[projectIdx !== -1 ? projectIdx : 1] || '').trim() || undefined,
        category: (row[categoryIdx !== -1 ? categoryIdx : 2] || '').trim() || 'General',
        status,
        dueDate,
        priority: (row[priorityIdx !== -1 ? priorityIdx : 6] || '').trim() || 'Medium',
        notes: (row[notesIdx !== -1 ? notesIdx : 7] || '').trim() || undefined,
        topTask: topTaskVal === 'TRUE',
      });
    }

    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err.message);
    res.json(getDemoTasks());
  }
});

// GET /api/sheets/touchpoints — Fetch client touchpoints from Google Sheet
// Sheet columns: name | nickname | birth_date (M/D) | primary_phone | primary_email | Birthday helper column
router.get('/touchpoints', async (_req, res) => {
  try {
    const client = getSheets();
    if (!client) {
      return res.json(getDemoTouchpoints());
    }

    const sheetId = process.env.GOOGLE_SHEET_ID_TOUCHPOINTS;
    if (!sheetId || sheetId === 'your_touchpoints_sheet_id_here') {
      return res.json(getDemoTouchpoints());
    }

    const response = await client.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:F',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return res.json([]);

    const headers = rows[0].map((h) => h.toLowerCase().trim());
    const nameIdx = headers.indexOf('name');
    const nicknameIdx = headers.indexOf('nickname');
    const birthIdx = headers.indexOf('birth_date');
    const phoneIdx = headers.indexOf('primary_phone');
    const emailIdx = headers.indexOf('primary_email');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    const touchpoints = [];
    let id = 1;

    for (const row of rows.slice(1)) {
      const name = (row[nameIdx !== -1 ? nameIdx : 0] || '').trim();
      const birthDateStr = (row[birthIdx !== -1 ? birthIdx : 2] || '').trim();

      // Skip rows without a birth date (household headers, companies, etc.)
      if (!birthDateStr || !name) continue;

      // Parse M/D or M/D/YYYY format
      const parts = birthDateStr.split('/');
      if (parts.length < 2) continue;

      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) continue;

      // Compute next upcoming birthday
      let nextBirthday = new Date(currentYear, month - 1, day);
      nextBirthday.setHours(0, 0, 0, 0);
      // If the birthday already passed this year, use next year
      if (nextBirthday < today) {
        nextBirthday = new Date(currentYear + 1, month - 1, day);
      }

      const nickname = (row[nicknameIdx !== -1 ? nicknameIdx : 1] || '').trim();
      const phone = (row[phoneIdx !== -1 ? phoneIdx : 3] || '').trim();
      const email = (row[emailIdx !== -1 ? emailIdx : 4] || '').trim();

      const daysAway = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));

      // Generate suggested action based on proximity
      let suggestedAction = 'Send birthday card';
      if (daysAway <= 7) {
        suggestedAction = 'Send birthday card + call';
      }
      if (phone) {
        suggestedAction += phone ? '' : '';
      }

      touchpoints.push({
        id: id++,
        clientName: name,
        nickname: nickname || undefined,
        date: nextBirthday.toISOString().split('T')[0],
        type: 'Birthday',
        suggestedAction,
        phone: phone || undefined,
        email: email || undefined,
      });
    }

    // Sort by nearest date and return upcoming (next 60 days)
    touchpoints.sort((a, b) => new Date(a.date) - new Date(b.date));
    const upcoming = touchpoints.filter((tp) => {
      const days = Math.ceil((new Date(tp.date) - today) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 60;
    });

    res.json(upcoming);
  } catch (err) {
    console.error('Error fetching touchpoints:', err.message);
    res.json(getDemoTouchpoints());
  }
});

// --- Helper functions for task mutations ---

/** Convert YYYY-MM-DD → M/D/YYYY for Google Sheets */
function toSheetDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`;
}

/** Build a 9-element array matching columns A–I */
function taskToRow(data) {
  return [
    data.task || '',
    data.project || '',
    '', // Category — auto-populated by sheet formula, leave blank
    data.status || 'To Do',
    toSheetDate(data.dueDate),
    '', // Days to Complete — calculated by sheet formula
    data.priority || 'Medium',
    data.notes || '',
    data.topTask ? 'TRUE' : 'FALSE',
  ];
}

// POST /api/sheets/tasks — Append a new task row
router.post('/tasks', async (req, res) => {
  try {
    const client = getSheets();
    if (!client) return res.status(503).json({ error: 'Sheets not configured' });

    const sheetId = process.env.GOOGLE_SHEET_ID_TASKS;
    if (!sheetId || sheetId === 'your_task_sheet_id_here') {
      return res.status(503).json({ error: 'Sheet ID not configured' });
    }

    const row = taskToRow(req.body);

    await client.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Tasks!A:I',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Error creating task:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sheets/tasks/:sheetRow — Update task (skip Category column C — it has a formula)
router.put('/tasks/:sheetRow', async (req, res) => {
  try {
    const client = getSheets();
    if (!client) return res.status(503).json({ error: 'Sheets not configured' });

    const sheetId = process.env.GOOGLE_SHEET_ID_TASKS;
    if (!sheetId || sheetId === 'your_task_sheet_id_here') {
      return res.status(503).json({ error: 'Sheet ID not configured' });
    }

    const rowNum = parseInt(req.params.sheetRow, 10);
    if (isNaN(rowNum) || rowNum < 2) {
      return res.status(400).json({ error: 'Invalid row number' });
    }

    const data = req.body;

    // Update columns A-B (Task, Project) — skip C (Category, formula)
    await client.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Tasks!A${rowNum}:B${rowNum}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[data.task || '', data.project || '']] },
    });

    // Update columns D-I (Status, Due Date, Days to Complete, Priority, Notes, Top Task) — skip C
    await client.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Tasks!D${rowNum}:I${rowNum}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          data.status || 'To Do',
          toSheetDate(data.dueDate),
          '', // Days to Complete — calculated by sheet
          data.priority || 'Medium',
          data.notes || '',
          data.topTask ? 'TRUE' : 'FALSE',
        ]],
      },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Error updating task:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/sheets/tasks/:sheetRow/status — Update only the status cell (column D)
router.patch('/tasks/:sheetRow/status', async (req, res) => {
  try {
    const client = getSheets();
    if (!client) return res.status(503).json({ error: 'Sheets not configured' });

    const sheetId = process.env.GOOGLE_SHEET_ID_TASKS;
    if (!sheetId || sheetId === 'your_task_sheet_id_here') {
      return res.status(503).json({ error: 'Sheet ID not configured' });
    }

    const rowNum = parseInt(req.params.sheetRow, 10);
    if (isNaN(rowNum) || rowNum < 2) {
      return res.status(400).json({ error: 'Invalid row number' });
    }

    const { status } = req.body;
    if (!['To Do', 'In Progress', 'Done'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await client.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Tasks!D${rowNum}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[status]] },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Error updating task status:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sheets/tasks/:sheetRow — Remove a row from the sheet
router.delete('/tasks/:sheetRow', async (req, res) => {
  try {
    const client = getSheets();
    if (!client) return res.status(503).json({ error: 'Sheets not configured' });

    const sheetId = process.env.GOOGLE_SHEET_ID_TASKS;
    if (!sheetId || sheetId === 'your_task_sheet_id_here') {
      return res.status(503).json({ error: 'Sheet ID not configured' });
    }

    const rowNum = parseInt(req.params.sheetRow, 10);
    if (isNaN(rowNum) || rowNum < 2) {
      return res.status(400).json({ error: 'Invalid row number' });
    }

    // First, get the sheet's numeric ID (gid) for the Tasks tab
    const meta = await client.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: 'sheets(properties(sheetId,title))',
    });

    const tasksSheet = meta.data.sheets.find(
      (s) => s.properties.title === 'Tasks'
    );
    if (!tasksSheet) {
      return res.status(404).json({ error: 'Tasks sheet not found' });
    }

    await client.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: tasksSheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: rowNum - 1, // 0-indexed
                endIndex: rowNum,
              },
            },
          },
        ],
      },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting task:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function getDemoTasks() {
  return [
    { id: 1, task: 'Review Q1 portfolio performance reports', priority: 'High', dueDate: '2026-02-12', status: 'In Progress', category: 'Investment' },
    { id: 2, task: 'Send market update email to clients', priority: 'High', dueDate: '2026-02-11', status: 'To Do', category: 'Client Comm' },
    { id: 3, task: 'Record Reel: "3 things to know this week"', priority: 'Medium', dueDate: '2026-02-13', status: 'To Do', category: 'Content' },
    { id: 4, task: 'Update CRM with new prospect notes', priority: 'Medium', dueDate: '2026-02-14', status: 'To Do', category: 'Operations' },
    { id: 5, task: 'Draft LinkedIn post on tax-loss harvesting', priority: 'Low', dueDate: '2026-02-15', status: 'To Do', category: 'Marketing' },
    { id: 6, task: 'Prepare sermon outline for Sunday', priority: 'Medium', dueDate: '2026-02-15', status: 'In Progress', category: 'Seminary' },
    { id: 7, task: 'Schedule annual review for Johnson family', priority: 'High', dueDate: '2026-02-12', status: 'To Do', category: 'Client Comm' },
    { id: 8, task: 'Rebalance moderate growth model portfolio', priority: 'High', dueDate: '2026-02-11', status: 'Done', category: 'Investment' },
  ];
}

function getDemoTouchpoints() {
  const today = new Date();
  const fmt = (daysFromNow) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
  };
  return [
    { id: 1, clientName: 'Sarah Johnson', date: fmt(2), type: 'Birthday', suggestedAction: 'Send card + call', lastContact: fmt(-14) },
    { id: 2, clientName: 'Michael & Lisa Chen', date: fmt(5), type: 'Anniversary', suggestedAction: 'Send congratulations email', lastContact: fmt(-30) },
    { id: 3, clientName: 'Robert Williams', date: fmt(8), type: 'Annual Review', suggestedAction: 'Schedule meeting + prep report', lastContact: fmt(-60) },
    { id: 4, clientName: 'Patricia Davis', date: fmt(12), type: 'Birthday', suggestedAction: 'Send card', lastContact: fmt(-20) },
    { id: 5, clientName: 'James & Maria Garcia', date: fmt(18), type: 'Annual Review', suggestedAction: 'Schedule meeting + prep report', lastContact: fmt(-90) },
    { id: 6, clientName: 'Emily Thompson', date: fmt(25), type: 'Anniversary', suggestedAction: 'Send congratulations card', lastContact: fmt(-45) },
  ];
}

export { router as sheetsRouter };
