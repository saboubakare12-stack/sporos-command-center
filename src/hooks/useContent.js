import { useState, useEffect, useCallback } from 'react';
import {
  fetchContent,
  createContent,
  updateContent,
  deleteContent,
} from '../utils/api';

export function useContent() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchContent();
      setContent(data);
    } catch (err) {
      console.error('Failed to load content:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addContent = useCallback(async (data) => {
    const optimistic = {
      id: 'temp-' + Date.now(),
      title: data.title,
      type: data.type || '',
      status: data.status || 'Not started',
      dateScheduled: data.dateScheduled || '',
      platforms: data.platforms || [],
      script: data.script || '',
    };
    setContent((prev) => [...prev, optimistic]);
    setSaving(true);
    setError(null);
    try {
      await createContent(data);
      await load();
    } catch (err) {
      setContent((prev) => prev.filter((c) => c.id !== optimistic.id));
      setError('Failed to add content: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [load]);

  const editContent = useCallback(async (pageId, data) => {
    const prev = content;
    setContent((cur) =>
      cur.map((c) => (c.id === pageId ? { ...c, ...data } : c))
    );
    setSaving(true);
    setError(null);
    try {
      await updateContent(pageId, data);
      await load();
    } catch (err) {
      setContent(prev);
      setError('Failed to update content: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [content, load]);

  const removeContent = useCallback(async (pageId) => {
    const prev = content;
    setContent((cur) => cur.filter((c) => c.id !== pageId));
    setSaving(true);
    setError(null);
    try {
      await deleteContent(pageId);
      await load();
    } catch (err) {
      setContent(prev);
      setError('Failed to delete content: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [content, load]);

  const clearError = useCallback(() => setError(null), []);

  return {
    content,
    loading,
    saving,
    error,
    clearError,
    refresh: load,
    addContent,
    editContent,
    removeContent,
  };
}
