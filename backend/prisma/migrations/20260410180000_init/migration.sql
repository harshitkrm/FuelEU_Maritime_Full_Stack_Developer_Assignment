-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "BankEntryKind" AS ENUM ('bank', 'apply');

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "vessel_id" TEXT NOT NULL,
    "fuel_type" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "fuel_consumption_t" DECIMAL(18,6) NOT NULL,
    "actual_intensity_gco2e_per_mj" DECIMAL(18,6) NOT NULL,
    "is_baseline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ship_compliance" (
    "ship_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "compliance_balance_gco2e" DECIMAL(20,6) NOT NULL,
    "verified_positive_for_banking" BOOLEAN NOT NULL DEFAULT false,
    "consecutive_non_compliant_years" INTEGER NOT NULL DEFAULT 0,
    "voyages_in_scope" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ship_compliance_pkey" PRIMARY KEY ("ship_id","year")
);

-- CreateTable
CREATE TABLE "bank_entries" (
    "id" TEXT NOT NULL,
    "ship_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "amount_gco2e" DECIMAL(20,6) NOT NULL,
    "kind" "BankEntryKind" NOT NULL,

    CONSTRAINT "bank_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pools" (
    "id" TEXT NOT NULL,
    "reporting_year" INTEGER NOT NULL,

    CONSTRAINT "pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pool_members" (
    "id" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "ship_id" TEXT NOT NULL,
    "compliance_balance_gco2e" DECIMAL(20,6) NOT NULL,

    CONSTRAINT "pool_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pool_members_pool_id_ship_id_key" ON "pool_members"("pool_id", "ship_id");

-- AddForeignKey
ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
