const BASE = '/api';

async function fetchJSON(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function mutateJSON(path, method, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

export function fetchTasks() {
  return fetchJSON('/sheets/tasks');
}

export function createTask(data) {
  return mutateJSON('/sheets/tasks', 'POST', data);
}

export function updateTask(sheetRow, data) {
  return mutateJSON(`/sheets/tasks/${sheetRow}`, 'PUT', data);
}

export function updateTaskStatus(sheetRow, status) {
  return mutateJSON(`/sheets/tasks/${sheetRow}/status`, 'PATCH', { status });
}

export function deleteTask(sheetRow) {
  return mutateJSON(`/sheets/tasks/${sheetRow}`, 'DELETE');
}

export function fetchTouchpoints() {
  return fetchJSON('/sheets/touchpoints');
}

export function fetchContent() {
  return fetchJSON('/notion/content');
}

export function createContent(data) {
  return mutateJSON('/notion/content', 'POST', data);
}

export function updateContent(pageId, data) {
  return mutateJSON(`/notion/content/${pageId}`, 'PUT', data);
}

export function deleteContent(pageId) {
  return mutateJSON(`/notion/content/${pageId}`, 'DELETE');
}

export function fetchMarketQuotes() {
  return fetchJSON('/market/quotes');
}

export function fetchSparklines() {
  return fetchJSON('/market/sparklines');
}

export function fetchMarketConfig() {
  return fetchJSON('/market/config');
}
