import { z } from "zod";
import { MEMBER_ROLES, RESERVED_SLUGS, TENANT_PLANS, TENANT_TYPES } from "../constants/index.js";

export const tenantSlugSchema = z
  .string()
  .min(3)
  .max(48)
  .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
  .refine((slug) => !RESERVED_SLUGS.has(slug), "Slug is reserved");

export const tenantTypeSchema = z.enum(TENANT_TYPES);
export const tenantPlanSchema = z.enum(TENANT_PLANS);
export const memberRoleSchema = z.enum(MEMBER_ROLES);

export type TenantType = z.infer<typeof tenantTypeSchema>;
export type TenantPlan = z.infer<typeof tenantPlanSchema>;
export type MemberRole = z.infer<typeof memberRoleSchema>;
