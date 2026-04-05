import { useState, useCallback } from 'react';
import { analyzeReport } from '../lib/api';
import type { AnalyzeRequest } from '../types';

export function useAnalyze() {
  const [report, setReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (request: AnalyzeRequest) => {
    setReport('');
    setError(null);
    setIsLoading(true);

    await analyzeReport(
      request,
      (delta) => setReport((prev) => prev + delta),
      () => setIsLoading(false),
      (msg) => {
        setError(msg);
        setIsLoading(false);
      }
    );
  }, []);

  const updateReport = useCallback((newReport: string) => {
    setReport(newReport);
  }, []);

  const clearReport = useCallback(() => {
    setReport('');
    setError(null);
  }, []);

  return { report, isLoading, error, analyze, updateReport, clearReport };
}
