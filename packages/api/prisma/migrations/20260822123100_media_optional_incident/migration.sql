-- Make MediaAsset optional before incident link
-- This supports presigned uploads: assets are created first, then attached during incident reporting.
ALTER TABLE "MediaAsset" ALTER COLUMN "incidentId" DROP NOT NULL;
