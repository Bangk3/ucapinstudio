-- Add phone_hash column for guest deduplication.
-- SHA-256 of (env salt + tenant_id + normalized E.164 phone), 64 hex chars.
-- Plaintext phone stays in `phone`; hash is the indexable dedup key.
ALTER TABLE "guests" ADD COLUMN "phone_hash" varchar(64);

-- Partial unique index — only rows with non-NULL phone_hash participate.
-- Existing rows without phone_hash (legacy data) are not enforced.
CREATE UNIQUE INDEX "guests_invitation_phone_hash_unique"
  ON "guests" ("invitation_id", "phone_hash")
  WHERE "phone_hash" IS NOT NULL;
