import { account, db, memberships, session, tenants, user, verification } from "@invyte/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { nanoid } from "nanoid";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),

  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  trustedOrigins:
    process.env.NODE_ENV === "development"
      ? [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3002",
          "http://localhost:3003",
          "http://localhost:3004",
          "http://localhost:3005",
          "http://localhost:3006",
          "http://localhost:3007",
          "http://localhost:3008",
          "http://localhost:3009",
        ]
      : [],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },

  user: {
    additionalFields: {
      locale: { type: "string", defaultValue: "id", fieldName: "locale" },
      timezone: { type: "string", defaultValue: "Asia/Jakarta", fieldName: "timezone" },
    },
  },

  session: {
    additionalFields: {
      activeTenantId: { type: "string", required: false, fieldName: "active_tenant_id" },
    },
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (newUser) => {
          // Auto-create personal tenant on signup
          const tenantId = nanoid();
          const slug = `user-${nanoid(8).toLowerCase()}`;

          await db.insert(tenants).values({
            id: tenantId,
            slug,
            name: newUser.name,
            type: "personal",
            plan: "free",
            settings: {},
            limits: {
              maxInvitations: 3,
              maxGuests: 500,
              aiGenerationsPerMonth: 5,
            },
          });

          await db.insert(memberships).values({
            userId: newUser.id,
            tenantId,
            role: "owner",
          });
        },
      },
    },
  },

  plugins: [nextCookies()],
});

export type Auth = typeof auth;
