import { z } from 'zod';

import { isoDateTimeSchema } from './common';

export const newsletterSubscriptionInputSchema = z.object({
  email: z.email('Informe um e-mail válido.').trim().toLowerCase(),
});
export type NewsletterSubscriptionInput = z.infer<typeof newsletterSubscriptionInputSchema>;

export const newsletterSubscriptionSchema = z.object({
  email: z.string(),
  subscribedAt: isoDateTimeSchema,
});
export type NewsletterSubscription = z.infer<typeof newsletterSubscriptionSchema>;
