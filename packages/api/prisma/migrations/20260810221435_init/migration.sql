-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'CFP', 'OPERATOR', 'ANALYST', 'COMMANDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Agency" AS ENUM ('NPF', 'DSS', 'NSCDC', 'ARMY_OPWS', 'SEMA', 'NEMA', 'VIGILANTE', 'FIRE_SERVICE', 'FRSC', 'HEALTH', 'OTHER');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('APP', 'USSD', 'SMS', 'VOICE', 'PANIC');

-- CreateEnum
CREATE TYPE "IncidentCategory" AS ENUM ('ARMED_GROUP_MOVEMENT', 'SUSPICIOUS_GATHERING', 'THREATS_INCITEMENT', 'CROP_DESTRUCTION', 'LAND_BOUNDARY_DISPUTE', 'KIDNAPPING', 'ATTACK_IN_PROGRESS', 'DISPLACEMENT', 'CATTLE_RUSTLING', 'HIGHWAY_ROBBERY', 'MISSING_PERSON', 'SUSPICIOUS_STRANGERS', 'WEAPON_SIGHTING', 'GBV', 'RUMOUR_VERIFICATION');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('PENDING', 'IN_TRIAGE', 'DISPATCHED', 'ON_SCENE', 'RESOLVED', 'CLOSED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('P1', 'P2', 'P3', 'P4');

-- CreateEnum
CREATE TYPE "Credibility" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "IncidentEventType" AS ENUM ('CREATED', 'TRIAGED', 'VERIFIED', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'UPDATED', 'NOTE_ADDED', 'MEDIA_ATTACHED', 'RESOLVED', 'CLOSED', 'DISMISSED', 'REOPENED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "AlertLevel" AS ENUM ('GREEN', 'YELLOW', 'ORANGE', 'RED');

-- CreateEnum
CREATE TYPE "EwiGroup" AS ENUM ('STRUCTURAL', 'PROXIMATE', 'ACUTE');

-- CreateEnum
CREATE TYPE "EwiIndicatorType" AS ENUM ('RAINFALL_DEFICIT', 'CROP_FAILURE', 'CATTLE_ROUTE_ENCROACHMENT', 'CONFLICT_RECURRENCE', 'ARMS_AVAILABILITY', 'UNUSUAL_CATTLE_MOVEMENT', 'THREAT_MESSAGES', 'WATER_DISPUTE', 'RETALIATION_CYCLE', 'MARKET_SCHOOL_CLOSURE', 'NIGHT_FOREST_MOVEMENT', 'ARMED_ASSEMBLY', 'ATTACK_RECON', 'MASS_PANIC', 'COMMS_BLACKOUT');

-- CreateEnum
CREATE TYPE "ResponderType" AS ENUM ('PATROL', 'QRF', 'MEDIC', 'FIRE', 'VIGILANTE_TEAM', 'PEACE_COMMITTEE');

-- CreateEnum
CREATE TYPE "ResponderStatus" AS ENUM ('AVAILABLE', 'DISPATCHED', 'ON_SCENE', 'RETURNING', 'OFF_DUTY');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('PATROL_VEHICLE', 'MOTORCYCLE', 'BOAT', 'AMBULANCE');

-- CreateEnum
CREATE TYPE "ResponseTier" AS ENUM ('TIER_1_LOCAL', 'TIER_2_LGA', 'TIER_3_STATE', 'TIER_4_FEDERAL');

-- CreateEnum
CREATE TYPE "ResponseModality" AS ENUM ('KINETIC', 'MEDIATION', 'HUMANITARIAN', 'PUBLIC_ALERT', 'COUNTER_INFO');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');

-- CreateTable
CREATE TABLE "Lga" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capital" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Benue',
    "populationEstimate" INTEGER,
    "centroid" geography(Point,4326) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ward" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lgaId" TEXT NOT NULL,
    "centroid" geography(Point,4326) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CITIZEN',
    "agency" "Agency",
    "lgaId" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "category" "IncidentCategory" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'P3',
    "credibility" "Credibility" NOT NULL DEFAULT 'C',
    "description" TEXT NOT NULL,
    "geo" geography(Point,4326) NOT NULL,
    "channel" "Channel" NOT NULL,
    "lgaId" TEXT NOT NULL,
    "wardId" TEXT,
    "reporterId" TEXT,
    "assignedResponderId" TEXT,
    "responseTier" "ResponseTier",
    "responseModality" "ResponseModality",
    "responseSopCode" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatchedAt" TIMESTAMP(3),
    "onSceneAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentEvent" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "type" "IncidentEventType" NOT NULL,
    "note" TEXT,
    "actorId" TEXT,
    "actorName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "geo" geography(Point,4326),
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responder" (
    "id" TEXT NOT NULL,
    "callsign" TEXT NOT NULL,
    "agency" "Agency" NOT NULL,
    "type" "ResponderType" NOT NULL,
    "status" "ResponderStatus" NOT NULL DEFAULT 'AVAILABLE',
    "geo" geography(Point,4326),
    "lgaId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "userId" TEXT,
    "currentIncidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Responder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "callsign" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "agency" "Agency" NOT NULL,
    "lgaId" TEXT NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "geo" geography(Point,4326),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertState" (
    "id" TEXT NOT NULL,
    "wardId" TEXT NOT NULL,
    "level" "AlertLevel" NOT NULL DEFAULT 'GREEN',
    "score" INTEGER NOT NULL DEFAULT 0,
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "contributingIndicators" JSONB,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EwiIndicator" (
    "id" TEXT NOT NULL,
    "wardId" TEXT NOT NULL,
    "type" "EwiIndicatorType" NOT NULL,
    "group" "EwiGroup" NOT NULL,
    "weight" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EwiIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiniCommandCentre" (
    "id" TEXT NOT NULL,
    "lgaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" geography(Point,4326) NOT NULL,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "isOperational" BOOLEAN NOT NULL DEFAULT false,
    "commissionedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MiniCommandCentre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sop" (
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "triggers" "IncidentCategory"[],
    "defaultTier" "ResponseTier" NOT NULL,
    "modalities" "ResponseModality"[],
    "leadAgency" "Agency" NOT NULL,
    "supportAgencies" "Agency"[],
    "steps" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sop_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lga_code_key" ON "Lga"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Lga_name_key" ON "Lga"("name");

-- CreateIndex
CREATE INDEX "Lga_code_idx" ON "Lga"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Ward_code_key" ON "Ward"("code");

-- CreateIndex
CREATE INDEX "Ward_lgaId_idx" ON "Ward"("lgaId");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_lgaId_idx" ON "User"("lgaId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_reference_key" ON "Incident"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_assignedResponderId_key" ON "Incident"("assignedResponderId");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- CreateIndex
CREATE INDEX "Incident_priority_idx" ON "Incident"("priority");

-- CreateIndex
CREATE INDEX "Incident_category_idx" ON "Incident"("category");

-- CreateIndex
CREATE INDEX "Incident_lgaId_idx" ON "Incident"("lgaId");

-- CreateIndex
CREATE INDEX "Incident_wardId_idx" ON "Incident"("wardId");

-- CreateIndex
CREATE INDEX "Incident_createdAt_idx" ON "Incident"("createdAt");

-- CreateIndex
CREATE INDEX "Incident_occurredAt_idx" ON "Incident"("occurredAt");

-- CreateIndex
CREATE INDEX "IncidentEvent_incidentId_idx" ON "IncidentEvent"("incidentId");

-- CreateIndex
CREATE INDEX "IncidentEvent_type_idx" ON "IncidentEvent"("type");

-- CreateIndex
CREATE INDEX "MediaAsset_incidentId_idx" ON "MediaAsset"("incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "Responder_callsign_key" ON "Responder"("callsign");

-- CreateIndex
CREATE UNIQUE INDEX "Responder_currentIncidentId_key" ON "Responder"("currentIncidentId");

-- CreateIndex
CREATE INDEX "Responder_lgaId_idx" ON "Responder"("lgaId");

-- CreateIndex
CREATE INDEX "Responder_status_idx" ON "Responder"("status");

-- CreateIndex
CREATE INDEX "Responder_agency_idx" ON "Responder"("agency");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_callsign_key" ON "Vehicle"("callsign");

-- CreateIndex
CREATE INDEX "Vehicle_lgaId_idx" ON "Vehicle"("lgaId");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AlertState_wardId_key" ON "AlertState"("wardId");

-- CreateIndex
CREATE INDEX "AlertState_level_idx" ON "AlertState"("level");

-- CreateIndex
CREATE INDEX "EwiIndicator_wardId_idx" ON "EwiIndicator"("wardId");

-- CreateIndex
CREATE INDEX "EwiIndicator_type_idx" ON "EwiIndicator"("type");

-- CreateIndex
CREATE INDEX "EwiIndicator_isActive_idx" ON "EwiIndicator"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MiniCommandCentre_lgaId_key" ON "MiniCommandCentre"("lgaId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES "Lga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES "Lga"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES "Lga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_assignedResponderId_fkey" FOREIGN KEY ("assignedResponderId") REFERENCES "Responder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentEvent" ADD CONSTRAINT "IncidentEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentEvent" ADD CONSTRAINT "IncidentEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responder" ADD CONSTRAINT "Responder_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES "Lga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responder" ADD CONSTRAINT "Responder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responder" ADD CONSTRAINT "Responder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES "Lga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertState" ADD CONSTRAINT "AlertState_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EwiIndicator" ADD CONSTRAINT "EwiIndicator_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiniCommandCentre" ADD CONSTRAINT "MiniCommandCentre_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES "Lga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- PostGIS extension + geography columns (Prisma declares these
-- as Unsupported, so they're added here manually)
-- ============================================================

-- Extension is already enabled on the bescewers database (via psql).
-- This is idempotent — safe to include.
CREATE EXTENSION IF NOT EXISTS postgis;

-- Geography columns (Prisma omits these from the DDL above)
ALTER TABLE "Lga" ADD COLUMN IF NOT EXISTS "centroid" geography(Point, 4326);
ALTER TABLE "Ward" ADD COLUMN IF NOT EXISTS "centroid" geography(Point, 4326);
ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "geo" geography(Point, 4326);
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "geo" geography(Point, 4326);
ALTER TABLE "Responder" ADD COLUMN IF NOT EXISTS "geo" geography(Point, 4326);
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "geo" geography(Point, 4326);
ALTER TABLE "MiniCommandCentre" ADD COLUMN IF NOT EXISTS "location" geography(Point, 4326);

-- Spatial indexes for fast map-viewport + nearest-neighbour queries
CREATE INDEX IF NOT EXISTS "idx_incidents_geo" ON "Incident" USING GIST ("geo");
CREATE INDEX IF NOT EXISTS "idx_wards_centroid" ON "Ward" USING GIST ("centroid");
CREATE INDEX IF NOT EXISTS "idx_lgas_centroid" ON "Lga" USING GIST ("centroid");
CREATE INDEX IF NOT EXISTS "idx_responders_geo" ON "Responder" USING GIST ("geo");
