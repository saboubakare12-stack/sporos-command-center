import { useState, useEffect, useCallback } from 'react';
import { fetchContent } from '../utils/api';

export function useContent() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return { content, loading, refresh: load };
}
