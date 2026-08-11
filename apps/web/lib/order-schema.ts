import { z } from "zod";

/**
 * Shared between the token-based intake form (/api/v1/orders/[token]/submit,
 * used after an admin creates the order) and the public self-service form
 * (/api/v1/orders/public, which creates the order itself) — both accept the
 * exact same wedding-details payload shape.
 */
export const eventSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  date: z.string().optional(),
  time: z.string().optional(),
  venueName: z.string().max(255).optional(),
  venueAddress: z.string().max(500).optional(),
});

export const submittedDataSchema = z.object({
  hosts: z.object({
    groomName: z.string().min(1).max(255),
    brideName: z.string().min(1).max(255),
    groomFull: z.string().max(255).optional(),
    brideFull: z.string().max(255).optional(),
    groomParents: z.string().max(255).optional(),
    brideParents: z.string().max(255).optional(),
  }),
  events: z.array(eventSchema).min(1),
  story: z.string().max(5000).optional(),
});

export const MAX_GALLERY_IMAGES = 10;
