import { z } from 'zod';

import { ETH_AMOUNT_PATTERN } from '@/shared/lib/money';

/** Decimal ETH amount transported as string, e.g. "1.19". */
export const ethAmountSchema = z
  .string()
  .regex(ETH_AMOUNT_PATTERN, 'Expected a non-negative decimal ETH amount');

export const isoDateTimeSchema = z.iso.datetime({ offset: true });

export const positiveIntSchema = z.number().int().positive();
export const nonNegativeIntSchema = z.number().int().nonnegative();

/** Builds the standard paginated envelope used by every list endpoint. */
export function paginatedSchema<TItem extends z.ZodType>(item: TItem) {
  return z.object({
    items: z.array(item),
    page: positiveIntSchema,
    pageSize: positiveIntSchema,
    totalItems: nonNegativeIntSchema,
    totalPages: nonNegativeIntSchema,
  });
}

export interface Paginated<TItem> {
  items: TItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
