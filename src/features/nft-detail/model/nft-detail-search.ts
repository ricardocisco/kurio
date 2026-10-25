import { z } from 'zod';

export const nftDetailSearchSchema = z.object({
  edition: z.string().min(1).optional().catch(undefined),
});

export type NftDetailSearch = z.infer<typeof nftDetailSearchSchema>;
