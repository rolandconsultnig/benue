# CEWERS Operations Runbook

## 1. System Overview
CEWERS (Conflict Early Warning and Early Response System) is deployed as a multi-tier platform using Docker.
- **Frontend (Console):** React SPA served by Nginx.
- **Backend (API):** NestJS application.
- **Edge (USSD/Mobile):** Express gateways and React Native apps.
- **Datastore:** PostgreSQL (w/ PostGIS), Redis, MinIO (S3-compatible).

## 2. Deployment
The primary production deployment mechanism is via Docker Compose.
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
This single command builds the multi-stage Dockerfile and spins up all requisite services.

### Updating Production
```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

## 3. Database Management

### Backups
Backups of the Postgres database should be taken daily using `pg_dump`:
```bash
docker exec -it cewers-postgres pg_dump -U postgres bescewers > /backups/cewers_$(date +%F).sql
```

### Restoring
```bash
cat /backups/cewers_2026-08-13.sql | docker exec -i cewers-postgres psql -U postgres bescewers
```

### Migrations
Prisma migrations are automatically applied on container startup via the `start.sh` script or can be run manually:
```bash
docker exec -it cewers-api pnpm --filter @cewers/api prisma:deploy
```

## 4. Disaster Recovery
If the server goes down:
1. Provision a new VPS.
2. Clone the repository and copy over the `.env` file.
3. Start the infrastructure: `docker compose -f docker-compose.prod.yml up -d`
4. Restore the latest database backup.

## 5. Scaling
- **API Nodes:** Update `docker-compose.prod.yml` to set `replicas: 3` for the API service (ensure you use a load balancer or Nginx upstream if doing this).
- **Redis:** Used for real-time WebSocket session state. Ensure it is accessible by all API instances.
