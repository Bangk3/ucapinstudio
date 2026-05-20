import { z } from "zod";
import { INVITATION_KINDS, INVITATION_STATUSES } from "../constants/index";

export const invitationStatusSchema = z.enum(INVITATION_STATUSES);
export const invitationKindSchema = z.enum(INVITATION_KINDS);

export type InvitationStatus = z.infer<typeof invitationStatusSchema>;
export type InvitationKind = z.infer<typeof invitationKindSchema>;

export const createInvitationSchema = z.object({
  name: z.string().min(1).max(255),
  kind: invitationKindSchema,
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
