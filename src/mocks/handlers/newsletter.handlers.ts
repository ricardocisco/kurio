import { http } from 'msw';

import {
  newsletterSubscriptionInputSchema,
  type NewsletterSubscription,
} from '@/shared/contracts/newsletter';

import { readDatabase, updateDatabase } from '../db/database';
import { apiPath } from '../utils/api-path';
import { errorResponse, jsonResponse } from '../utils/responses';

export const newsletterHandlers = [
  http.post(apiPath('/newsletter/subscriptions'), async ({ request }) => {
    const parsed = newsletterSubscriptionInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Verifique o e-mail informado.', {
        fieldErrors: { email: ['Informe um e-mail válido.'] },
      });
    }

    const { email } = parsed.data;
    if (readDatabase().newsletterSubscribers.includes(email)) {
      return errorResponse('CONFLICT', 'Este e-mail já recebe nossos alertas de lançamento.', {
        fieldErrors: { email: ['Este e-mail já está inscrito.'] },
      });
    }

    updateDatabase((draft) => {
      draft.newsletterSubscribers.push(email);
    });
    return jsonResponse<NewsletterSubscription>(
      { email, subscribedAt: new Date().toISOString() },
      { status: 201 },
    );
  }),
];
