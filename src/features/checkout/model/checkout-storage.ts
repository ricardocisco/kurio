import type { CheckoutFormValues, CreateOrderInput } from '@/shared/contracts/checkout';
import { readStorage, removeStorage, writeStorage } from '@/shared/lib/storage';

const DRAFT_KEY = 'kurio.checkout.draft';
const ATTEMPT_KEY = 'kurio.checkout.attempt';

export interface CheckoutAttempt {
  userId: string;
  idempotencyKey: string;
  request: CreateOrderInput;
  orderId: string | null;
}

export function readCheckoutDraft(userId: string): Partial<CheckoutFormValues> | null {
  const draft = readStorage<{ userId: string; values: Partial<CheckoutFormValues> }>(
    DRAFT_KEY,
    'session',
  );
  return draft?.userId === userId ? draft.values : null;
}

export function saveCheckoutDraft(userId: string, values: Partial<CheckoutFormValues>): void {
  writeStorage(DRAFT_KEY, { userId, values }, 'session');
}

export function clearCheckoutDraft(): void {
  removeStorage(DRAFT_KEY, 'session');
}

export function readCheckoutAttempt(userId: string): CheckoutAttempt | null {
  const attempt = readStorage<CheckoutAttempt>(ATTEMPT_KEY);
  return attempt?.userId === userId ? attempt : null;
}

export function saveCheckoutAttempt(attempt: CheckoutAttempt): void {
  writeStorage(ATTEMPT_KEY, attempt);
}

export function clearCheckoutAttempt(): void {
  removeStorage(ATTEMPT_KEY);
}
