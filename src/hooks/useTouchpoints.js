import { useState, useEffect, useCallback } from 'react';
import { fetchTouchpoints } from '../utils/api';

export function useTouchpoints() {
  const [touchpoints, setTouchpoints] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTouchpoints();
      setTouchpoints(data);
    } catch (err) {
      console.error('Failed to load touchpoints:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { touchpoints, loading, refresh: load };
}
