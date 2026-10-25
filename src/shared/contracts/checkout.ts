import { z } from 'zod';

import { appliedCouponSchema, cartSummarySchema } from './cart';
import { ethAmountSchema, isoDateTimeSchema, positiveIntSchema } from './common';
import { networkIdSchema, nftImageSchema } from './nft';
import { ENS_NAME_PATTERN, isValidWalletAddress, walletProviderSchema } from './wallets';

export const purchaseLineSchema = z.object({
  lineId: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  name: z.string(),
  tokenId: z.string(),
  editionLabel: z.string(),
  image: nftImageSchema,
  unitPrice: ethAmountSchema,
  quantity: positiveIntSchema,
  lineTotal: ethAmountSchema,
});
export type PurchaseLine = z.infer<typeof purchaseLineSchema>;

export const checkoutQuoteSchema = z.object({
  id: z.string(),
  network: networkIdSchema,
  lines: z.array(purchaseLineSchema).min(1),
  coupon: appliedCouponSchema.nullable(),
  summary: cartSummarySchema,
  createdAt: isoDateTimeSchema,
  expiresAt: isoDateTimeSchema,
});
export type CheckoutQuote = z.infer<typeof checkoutQuoteSchema>;

export const createQuoteInputSchema = z.object({ network: networkIdSchema });
export type CreateQuoteInput = z.infer<typeof createQuoteInputSchema>;

export const walletConnectionInputSchema = z.object({
  provider: walletProviderSchema,
  network: networkIdSchema,
  address: z.string().min(1),
  walletId: z.string().nullable(),
});
export type WalletConnectionInput = z.infer<typeof walletConnectionInputSchema>;

export const walletConnectionSchema = z.object({
  id: z.string(),
  provider: walletProviderSchema,
  network: networkIdSchema,
  address: z.string(),
  connectedAt: isoDateTimeSchema,
});
export type WalletConnection = z.infer<typeof walletConnectionSchema>;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .transform((value) => value || undefined)
    .optional();

export const collectorDetailsSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Informe seu nome de exibição.')
    .max(40, 'Use no máximo 40 caracteres.'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Informe seu nome de usuário.')
    .regex(/^[a-z0-9._]+$/, 'Use apenas letras minúsculas, números, ponto ou sublinhado.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Informe seu e-mail.')
    .pipe(z.email('Informe um e-mail válido.')),
  ensName: z
    .string()
    .trim()
    .toLowerCase()
    .transform((value) => value || undefined)
    .optional()
    .refine(
      (value) =>
        value === undefined ||
        ENS_NAME_PATTERN.test(`${value}.eth`) ||
        ENS_NAME_PATTERN.test(value),
      {
        message: 'Use apenas letras, números e hífen (mínimo 3 caracteres).',
      },
    ),
  referralCode: optionalText(20),
  note: optionalText(280),
});
export type CollectorDetails = z.infer<typeof collectorDetailsSchema>;

export const checkoutFormSchema = collectorDetailsSchema
  .extend({
    walletId: z.string().nullable(),
    useOtherWallet: z.boolean(),
    network: networkIdSchema,
    provider: walletProviderSchema,
    address: z.string().trim(),
  })
  .superRefine((form, context) => {
    if (!form.useOtherWallet && !form.walletId) {
      context.addIssue({ code: 'custom', path: ['walletId'], message: 'Selecione uma carteira.' });
    }
    if (!isValidWalletAddress(form.address, form.network)) {
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message:
          form.network === 'solana'
            ? 'Informe um endereço Solana válido.'
            : 'Informe um endereço 0x válido (42 caracteres).',
      });
    }
  });
export type CheckoutFormValues = z.input<typeof checkoutFormSchema>;
export type CheckoutFormOutput = z.output<typeof checkoutFormSchema>;

export const createOrderInputSchema = z.object({
  quoteId: z.string().min(1),
  walletConnectionId: z.string().min(1),
  collector: collectorDetailsSchema,
});
export type CreateOrderInput = z.input<typeof createOrderInputSchema>;

export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';
