import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { useEffect } from 'react';

import { isApiError } from '@/shared/api/api-error';

import { RetryButton, StatusMessage } from './StatusMessage';

/** Default route error boundary: resets failed queries and re-runs the route on retry. */
export function RouteErrorFallback({ error }: ErrorComponentProps) {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  const message = isApiError(error) ? error.message : 'Algo deu errado ao carregar esta página.';

  return (
    <div className="container-content py-16">
      <StatusMessage
        variant="error"
        title="Não foi possível carregar"
        description={message}
        action={<RetryButton onRetry={() => void router.invalidate()} />}
      />
    </div>
  );
}
