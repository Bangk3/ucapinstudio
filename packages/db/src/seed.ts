import { hashPassword } from "better-auth/crypto";
import { nanoid } from "nanoid";
import { account, db, memberships, tenants, user } from "./index";

const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";

async function seed() {
  console.log("🌱 Seeding database...");

  // Admin user
  const adminId = nanoid();
  await db
    .insert(user)
    .values({
      id: adminId,
      name: "Admin Undangan",
      email: "admin@undangan.local",
      emailVerified: true,
      locale: "id",
      timezone: "Asia/Jakarta",
    })
    .onConflictDoNothing();

  // Credential account so the admin can actually log in (better-auth needs
  // both `user` and `account` rows — a `user`-only insert is not a working
  // login). Uses better-auth's own hasher, same as its real signup flow.
  await db
    .insert(account)
    .values({
      id: nanoid(),
      accountId: adminId,
      providerId: "credential",
      userId: adminId,
      password: await hashPassword(ADMIN_PASSWORD),
    })
    .onConflictDoNothing();

  // Personal tenant for admin
  const personalTenantId = nanoid();
  await db
    .insert(tenants)
    .values({
      id: personalTenantId,
      slug: `user-${nanoid(8).toLowerCase()}`,
      name: "Admin Undangan",
      type: "personal",
      plan: "free",
      settings: {},
      limits: { maxInvitations: 3, maxGuests: 500, aiGenerationsPerMonth: 5 },
    })
    .onConflictDoNothing();

  await db
    .insert(memberships)
    .values({ userId: adminId, tenantId: personalTenantId, role: "owner" })
    .onConflictDoNothing();

  // Demo org tenant
  const orgTenantId = nanoid();
  await db
    .insert(tenants)
    .values({
      id: orgTenantId,
      slug: "demo-wo",
      name: "Demo Wedding Organizer",
      type: "organization",
      plan: "starter",
      settings: {},
      limits: { maxInvitations: 50, maxGuests: 5000, aiGenerationsPerMonth: 50 },
    })
    .onConflictDoNothing();

  await db
    .insert(memberships)
    .values({ userId: adminId, tenantId: orgTenantId, role: "owner" })
    .onConflictDoNothing();

  console.log("✅ Seed complete");
  console.log(`   Admin: admin@undangan.local / ${ADMIN_PASSWORD}`);
  console.log("   Personal tenant slug: see tenants table");
  console.log("   Org tenant: demo-wo");

  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
