-- migrate:up
CREATE TABLE "users" (
  "id" uuid NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "email" character varying NOT NULL,
  "country" character varying NOT NULL,
  "postalCode" character varying NOT NULL,
  "street" character varying NOT NULL,
  "role" character varying NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE ("email"),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Indexes for the columns filtered by findAllPaginatedFiltered, to avoid full-table
-- scans as the users table grows.
CREATE INDEX "idx_users_country" ON "users" ("country");
CREATE INDEX "idx_users_postal_code" ON "users" ("postalCode");
CREATE INDEX "idx_users_street" ON "users" ("street");

-- migrate:down
DROP TABLE "users"
