import { z } from "zod";

export const guestCategorySchema = z.enum([
  "family",
  "friends",
  "colleagues",
  "school",
  "community",
  "vip",
  "other",
]);

export type GuestCategory = z.infer<typeof guestCategorySchema>;

export const createGuestSchema = z.object({
  name: z.string().min(1).max(255),
  phone: z
    .string()
    .regex(/^\+?[0-9]{8,15}$/)
    .optional(),
  email: z.string().email().optional(),
  category: guestCategorySchema.default("other"),
  plusOneAllowed: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;

export const csvGuestRowSchema = createGuestSchema.extend({
  name: z.string().min(1, "Nama wajib diisi"),
});
