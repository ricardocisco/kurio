import { useCallback } from 'react';
import { toast } from 'sonner';

export function useComingSoon() {
  return useCallback((featureName: string) => {
    toast.info(`${featureName} ainda não está disponível.`, {
      description: 'Esta área faz parte de uma próxima etapa da Kurio.',
    });
  }, []);
}
