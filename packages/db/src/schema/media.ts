import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const mediaTypeEnum = pgEnum("media_type", ["image", "audio", "video", "document"]);

export const media = pgTable(
  "media",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    type: mediaTypeEnum("type").notNull(),
    storageKey: text("storage_key").notNull(),
    publicUrl: text("public_url"),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationSeconds: integer("duration_seconds"),
    variants: jsonb("variants").notNull().default({}),
    altText: varchar("alt_text", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("media_tenant_idx").on(t.tenantId, t.type)],
);

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
