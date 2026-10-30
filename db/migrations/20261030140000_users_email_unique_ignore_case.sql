-- migrate:up
-- Email uniqueness ignores case: John@x.com and john@x.com are the same address. The email is
-- still stored as typed. Fails if "users" already holds emails that differ only in case:
-- merge or fix those rows first.
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";
CREATE UNIQUE INDEX "users_email_lower_unique" ON "users" (lower("email"));

-- migrate:down
DROP INDEX "users_email_lower_unique";
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE ("email");
