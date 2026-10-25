import { z } from 'zod';

/** The selected edition is part of the URL so a shared link opens the same edition. */
export const nftDetailSearchSchema = z.object({
  edition: z.string().min(1).optional().catch(undefined),
});

export type NftDetailSearch = z.infer<typeof nftDetailSearchSchema>;
