-- migrate:up
CREATE TABLE "users" (
  "id" character varying NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "email" character varying NOT NULL,
  "country" character varying NOT NULL,
  "postalCode" character varying NOT NULL,
  "street" character varying NOT NULL,
  "role" character varying NOT NULL,
  CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"),
  CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
);

-- Indexes for the columns filtered by findAllPaginatedFiltered, to avoid full-table
-- scans as the users table grows.
CREATE INDEX "IDX_users_country" ON "users" ("country");
CREATE INDEX "IDX_users_postalCode" ON "users" ("postalCode");
CREATE INDEX "IDX_users_street" ON "users" ("street");

-- migrate:down
DROP TABLE "users"
