import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMarketQuotes, fetchSparklines, fetchMarketConfig } from '../utils/api';
import fallbackConfig from '../../sporos.config.js';

export function useMarketData() {
  const [quotes, setQuotes] = useState({});
  const [sparklines, setSparklines] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [marketOpen, setMarketOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(fallbackConfig);
  const intervalRef = useRef(null);

  const loadConfig = useCallback(async () => {
    try {
      const cfg = await fetchMarketConfig();
      if (cfg && cfg.indices) {
        setConfig(cfg);
      }
    } catch (err) {
      console.warn('Failed to load market config, using fallback:', err);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [quoteData, sparkData] = await Promise.all([
        fetchMarketQuotes(),
        fetchSparklines(),
      ]);
      setQuotes(quoteData.quotes || {});
      setMarketOpen(quoteData.marketOpen || false);
      setLastUpdated(quoteData.timestamp);
      setSparklines(sparkData || {});
    } catch (err) {
      console.error('Failed to load market data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    load();
    intervalRef.current = setInterval(load, (config.refreshInterval || 60) * 1000);
    return () => clearInterval(intervalRef.current);
  }, [load, loadConfig, config.refreshInterval]);

  return { quotes, sparklines, lastUpdated, marketOpen, loading, refresh: load, config };
}
