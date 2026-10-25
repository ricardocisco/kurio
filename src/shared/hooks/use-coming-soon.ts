import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Feedback for auxiliary actions that are out of the challenge scope (editorial pages, support,
 * activity...). It never pretends success: it tells the user the feature is not available yet.
 */
export function useComingSoon() {
  return useCallback((featureName: string) => {
    toast.info(`${featureName} ainda não está disponível.`, {
      description: 'Esta área faz parte de uma próxima etapa da Kurio.',
    });
  }, []);
}
