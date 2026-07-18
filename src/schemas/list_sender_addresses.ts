import { z } from "zod";

export const ListSenderAddressesInputSchema = z.object({}).strict();

export type ListSenderAddressesInput = z.infer<typeof ListSenderAddressesInputSchema>;
