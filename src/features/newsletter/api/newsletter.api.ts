import { sendJson } from '@/shared/api/http-client';
import {
  newsletterSubscriptionSchema,
  type NewsletterSubscription,
  type NewsletterSubscriptionInput,
} from '@/shared/contracts/newsletter';

export function subscribeToNewsletter(
  input: NewsletterSubscriptionInput,
): Promise<NewsletterSubscription> {
  return sendJson('post', '/newsletter/subscriptions', newsletterSubscriptionSchema, input);
}
