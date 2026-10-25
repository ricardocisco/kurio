import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { isApiError } from '@/shared/api/api-error';

export function applyServerErrors<TValues extends FieldValues>(
  error: unknown,
  fields: readonly Path<TValues>[],
  setError: UseFormSetError<TValues>,
): string | undefined {
  if (!isApiError(error)) return 'Não foi possível concluir. Tente novamente.';

  let appliedToField = false;
  for (const field of fields) {
    const message = error.fieldErrors[field]?.[0];
    if (message) {
      setError(field, { type: 'server', message }, { shouldFocus: !appliedToField });
      appliedToField = true;
    }
  }
  return appliedToField ? undefined : error.message;
}
