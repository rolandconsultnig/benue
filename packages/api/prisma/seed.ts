/**
 * CEWERS Database Seeder
 *
 * Populates:
 *   - 9 LGAs (with PostGIS centroids)
 *   - ~92 wards (with PostGIS centroids)
 *   - 15 SOPs
 *   - 6 demo users (one per role, bcrypt-hashed)
 *   - Sample responders & vehicles per LGA
 *   - ~40 sample incidents across all categories & LGAs (90-day span)
 *   - Initial AlertState (all GREEN) per ward
 *
 * Idempotent: safe to re-run; upserts keyed on stable codes.
 *
 * Run:  pnpm --filter @cewers/api prisma:seed
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
dotenv.config({ path: '.env' });

import { PrismaClient, type Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import {
  BENUE_SOUTH_LGAS,
  BENUE_SOUTH_WARDS,
  CATEGORIES,
  DEMO_USERS,
  SOPS,
  getLgaByCode,
  type LgaSeed,
} from '@cewers/shared';
import {
  Agency,
  AlertLevel,
  Channel,
  Credibility,
  IncidentCategory,
  IncidentEventType,
  IncidentStatus,
  Priority,
  ResponderStatus,
  ResponderType,
  VehicleType,
} from '@cewers/shared';

const prisma = new PrismaClient();

// ─── PostGIS helpers (raw SQL) ────────────────────────────────────────────────
// Prisma can't write geography columns directly; we use $executeRaw with
// ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography.

async function setLgaCentroid(lgaCode: string, lng: number, lat: number) {
  await prisma.$executeRaw`
    UPDATE "Lga" SET centroid = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
    WHERE code = ${lgaCode}
  `;
}

async function setWardCentroid(wardCode: string, lng: number, lat: number) {
  await prisma.$executeRaw`
    UPDATE "Ward" SET centroid = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
    WHERE code = ${wardCode}
  `;
}

async function setIncidentGeo(incidentId: string, lng: number, lat: number) {
  await prisma.$executeRaw`
    UPDATE "Incident" SET geo = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
    WHERE id = ${incidentId}
  `;
}

// ─── Seeders ──────────────────────────────────────────────────────────────────

async function seedLgas() {
  console.log('→ Seeding LGAs...');
  for (const lga of BENUE_SOUTH_LGAS) {
    await prisma.lga.upsert({
      where: { code: lga.code },
      update: {
        name: lga.name,
        capital: lga.capital,
        state: lga.state,
        populationEstimate: lga.populationEstimate,
      },
      create: {
        code: lga.code,
        name: lga.name,
        capital: lga.capital,
        state: lga.state,
        populationEstimate: lga.populationEstimate,
        centroid: undefined as never, // set via raw SQL below
      },
    });
    await setLgaCentroid(lga.code, lga.centroid.lng, lga.centroid.lat);

    // Mini Command Centre record
    await prisma.miniCommandCentre.upsert({
      where: { lgaId: (await prisma.lga.findUnique({ where: { code: lga.code } }))!.id },
      update: {},
      create: {
        name: `${lga.name} Mini Command Centre`,
        location: undefined as never,
        isOperational: lga.code === 'OTUKPO', // Otukpo commissioned first as pilot
        commissionedAt: lga.code === 'OTUKPO' ? new Date('2024-01-15') : null,
        lga: { connect: { code: lga.code } },
      },
    });
    // Set MCC location = LGA capital
    await prisma.$executeRaw`
      UPDATE "MiniCommandCentre" SET location = ST_SetSRID(ST_MakePoint(${lga.centroid.lng}, ${lga.centroid.lat}), 4326)::geography
      FROM "Lga" WHERE "MiniCommandCentre"."lgaId" = "Lga".id AND "Lga".code = ${lga.code}
    `;
  }
  console.log(`  ✓ ${BENUE_SOUTH_LGAS.length} LGAs`);
}

async function seedWards() {
  console.log('→ Seeding wards...');
  const lgaByCode = new Map<string, string>();
  for (const lga of await prisma.lga.findMany()) lgaByCode.set(lga.code, lga.id);

  for (const ward of BENUE_SOUTH_WARDS) {
    const lgaId = lgaByCode.get(ward.lgaCode)!;
    await prisma.ward.upsert({
      where: { code: ward.code },
      update: { name: ward.name, lgaId },
      create: {
        code: ward.code,
        name: ward.name,
        lgaId,
        centroid: undefined as never,
      },
    });
    await setWardCentroid(ward.code, ward.centroid.lng, ward.centroid.lat);
  }
  console.log(`  ✓ ${BENUE_SOUTH_WARDS.length} wards`);
}

async function seedSops() {
  console.log('→ Seeding SOPs...');
  for (const sop of SOPS) {
    await prisma.sop.upsert({
      where: { code: sop.code },
      update: {
        title: sop.title,
        triggers: sop.triggers,
        defaultTier: sop.defaultTier,
        modalities: sop.modalities,
        leadAgency: sop.leadAgency,
        supportAgencies: sop.supportAgencies,
        steps: sop.steps,
      },
      create: {
        code: sop.code,
        title: sop.title,
        triggers: sop.triggers,
        defaultTier: sop.defaultTier,
        modalities: sop.modalities,
        leadAgency: sop.leadAgency,
        supportAgencies: sop.supportAgencies,
        steps: sop.steps,
      },
    });
  }
  console.log(`  ✓ ${SOPS.length} SOPs`);
}

async function seedUsers() {
  console.log('→ Seeding demo users...');
  const passwordHash = await bcrypt.hash('cewers123', 10);
  const lgaByCode = new Map<string, string>();
  for (const lga of await prisma.lga.findMany()) lgaByCode.set(lga.code, lga.id);

  for (const u of DEMO_USERS) {
    await prisma.user.upsert({
      where: { phone: u.phone },
      update: {
        name: u.name,
        role: u.role,
        agency: u.agency,
        lgaId: u.lgaCode ? lgaByCode.get(u.lgaCode) : null,
        passwordHash,
        isActive: true,
      },
      create: {
        phone: u.phone,
        name: u.name,
        role: u.role,
        agency: u.agency,
        lgaId: u.lgaCode ? lgaByCode.get(u.lgaCode) : null,
        passwordHash,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ ${DEMO_USERS.length} demo users`);
}

async function seedResponders() {
  console.log('→ Seeding responders & vehicles...');
  const lgas = await prisma.lga.findMany();

  for (const lga of lgas) {
    // 2 patrol vehicles + 1 QRF vehicle + 3 motorcycles per LGA
    const vehicles = [
      { callsign: `${lga.code}-PV-1`, type: VehicleType.PATROL_VEHICLE, agency: Agency.NPF },
      { callsign: `${lga.code}-PV-2`, type: VehicleType.PATROL_VEHICLE, agency: Agency.NSCDC },
      { callsign: `${lga.code}-QRF-1`, type: VehicleType.PATROL_VEHICLE, agency: Agency.NPF },
      { callsign: `${lga.code}-MC-1`, type: VehicleType.MOTORCYCLE, agency: Agency.VIGILANTE },
      { callsign: `${lga.code}-MC-2`, type: VehicleType.MOTORCYCLE, agency: Agency.VIGILANTE },
      { callsign: `${lga.code}-MC-3`, type: VehicleType.MOTORCYCLE, agency: Agency.NPF },
    ];
    // Riverine LGAs get a boat
    if (lga.code === 'ADO' || lga.code === 'AGATU') {
      vehicles.push({ callsign: `${lga.code}-BOAT-1`, type: VehicleType.BOAT, agency: Agency.NSCDC });
    }

    for (const v of vehicles) {
      await prisma.vehicle.upsert({
        where: { callsign: v.callsign },
        update: {},
        create: {
          callsign: v.callsign,
          type: v.type,
          agency: v.agency,
          lgaId: lga.id,
          status: 'ACTIVE',
          geo: undefined as never,
        },
      });
    }

    // Responders: 1 QRF team + 1 patrol + 1 vigilante team + 1 peace committee per LGA
    const responders = [
      { callsign: `${lga.code}-QRF`, agency: Agency.NPF, type: ResponderType.QRF },
      { callsign: `${lga.code}-PATROL`, agency: Agency.NSCDC, type: ResponderType.PATROL, vehicle: `${lga.code}-PV-1` },
      { callsign: `${lga.code}-VIG-1`, agency: Agency.VIGILANTE, type: ResponderType.VIGILANTE_TEAM },
      { callsign: `${lga.code}-PEACE`, agency: Agency.OTHER, type: ResponderType.PEACE_COMMITTEE },
    ];
    for (const r of responders) {
      const vehicle = r.vehicle ? await prisma.vehicle.findUnique({ where: { callsign: r.vehicle } }) : null;
      await prisma.responder.upsert({
        where: { callsign: r.callsign },
        update: { lgaId: lga.id },
        create: {
          callsign: r.callsign,
          agency: r.agency,
          type: r.type,
          status: ResponderStatus.AVAILABLE,
          lgaId: lga.id,
          vehicleId: vehicle?.id ?? null,
          geo: undefined as never,
        },
      });
    }
  }
  console.log(`  ✓ responders & vehicles for ${lgas.length} LGAs`);
}

async function seedAlertStates() {
  console.log('→ Seeding initial alert states (all GREEN)...');
  const wards = await prisma.ward.findMany();
  for (const ward of wards) {
    await prisma.alertState.upsert({
      where: { wardId: ward.id },
      update: {},
      create: {
        wardId: ward.id,
        level: AlertLevel.GREEN,
        score: faker.number.int({ min: 0, max: 20 }),
        computedAt: new Date(),
      },
    });
  }
  console.log(`  ✓ ${wards.length} alert states`);
}

async function seedSampleIncidents() {
  console.log('→ Seeding sample incidents...');
  // Clear existing incidents so the seed is fully idempotent
  await prisma.incidentEvent.deleteMany();
  await prisma.incident.deleteMany();
  const lgas = await prisma.lga.findMany({ include: { wards: true } });
  const operatorUser = await prisma.user.findFirst({ where: { role: 'OPERATOR' } });
  const citizenUser = await prisma.user.findFirst({ where: { role: 'CITIZEN' } });
  const cfpUser = await prisma.user.findFirst({ where: { role: 'CFP' } });

  const channels = [Channel.APP, Channel.USSD, Channel.SMS, Channel.VOICE, Channel.PANIC];
  const statuses = [
    IncidentStatus.CLOSED,
    IncidentStatus.CLOSED,
    IncidentStatus.RESOLVED,
    IncidentStatus.ON_SCENE,
    IncidentStatus.DISPATCHED,
    IncidentStatus.IN_TRIAGE,
    IncidentStatus.PENDING,
  ];

  let incidentCount = 0;
  const incidentNumberRef = { n: 1 };

  // Weight incidents toward higher-risk LGAs (Agatu, Apa, Oju)
  const weightedLgas: typeof lgas = [];
  for (const lga of lgas) {
    const weight = (getLgaByCode(lga.code)?.highestRisk ? 4 : 1) +
      (['APA', 'OJU', 'OKPOKWU'].includes(lga.code) ? 2 : 0);
    for (let i = 0; i < weight; i++) weightedLgas.push(lga);
  }

  const NUM_INCIDENTS = 40;
  for (let i = 0; i < NUM_INCIDENTS; i++) {
    const lga = faker.helpers.arrayElement(weightedLgas);
    const ward = faker.helpers.arrayElement(lga.wards);
    const categoryMeta = faker.helpers.arrayElement(CATEGORIES);
    const status = faker.helpers.arrayElement(statuses);
    const channel = faker.helpers.arrayElement(channels);
    const reporter = faker.helpers.arrayElement([citizenUser, cfpUser, null]);
    const daysAgo = faker.number.int({ min: 1, max: 90 });
    const occurredAt = faker.date.recent({ days: daysAgo });

    const reference = `CEW-2024-${String(incidentNumberRef.n++).padStart(5, '0')}`;

    // Offset incident location slightly from ward centroid
    const wardCentroid = await prisma.$queryRaw<{ lng: number; lat: number }[]>`
      SELECT ST_X(centroid::geometry) AS lng, ST_Y(centroid::geometry) AS lat FROM "Ward" WHERE id = ${ward.id}
    `;
    const wc = wardCentroid[0];
    const lng = wc.lng + faker.number.float({ min: -0.02, max: 0.02 });
    const lat = wc.lat + faker.number.float({ min: -0.02, max: 0.02 });

    const incident = await prisma.incident.create({
      data: {
        reference,
        category: categoryMeta.value,
        status,
        priority: categoryMeta.defaultPriority,
        credibility: faker.helpers.arrayElement([Credibility.A, Credibility.B, Credibility.B, Credibility.C, Credibility.D]),
        description: `${categoryMeta.label}: ${faker.helpers.arrayElement([
          'Reported by community focal point.',
          'Multiple callers confirming the incident.',
          'Caller reports hearing gunshots.',
          'Villagers fleeing the area.',
          'Patrol confirmed the situation on arrival.',
          'CFP reports suspicious movement near the water point.',
        ])}`,
        geo: undefined as never,
        channel,
        lgaId: lga.id,
        wardId: ward.id,
        reporterId: reporter?.id ?? null,
        occurredAt,
        dispatchedAt: [IncidentStatus.DISPATCHED, IncidentStatus.ON_SCENE, IncidentStatus.RESOLVED, IncidentStatus.CLOSED].includes(status)
          ? new Date(occurredAt.getTime() + faker.number.int({ min: 5, max: 30 }) * 60_000)
          : null,
        onSceneAt: [IncidentStatus.ON_SCENE, IncidentStatus.RESOLVED, IncidentStatus.CLOSED].includes(status)
          ? new Date(occurredAt.getTime() + faker.number.int({ min: 30, max: 90 }) * 60_000)
          : null,
        resolvedAt: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED].includes(status)
          ? new Date(occurredAt.getTime() + faker.number.int({ min: 90, max: 240 }) * 60_000)
          : null,
        closedAt: status === IncidentStatus.CLOSED
          ? new Date(occurredAt.getTime() + faker.number.int({ min: 240, max: 480 }) * 60_000)
          : null,
      },
    });
    await setIncidentGeo(incident.id, lng, lat);

    // Add the CREATED event
    await prisma.incidentEvent.create({
      data: {
        incidentId: incident.id,
        type: IncidentEventType.CREATED,
        actorId: reporter?.id ?? null,
        actorName: reporter?.name ?? 'Anonymous',
        note: `Incident reported via ${channel}.`,
        createdAt: occurredAt,
      },
    });

    // For progressed incidents, add a TRIAGED event
    if ([IncidentStatus.IN_TRIAGE, IncidentStatus.DISPATCHED, IncidentStatus.ON_SCENE, IncidentStatus.RESOLVED, IncidentStatus.CLOSED].includes(status)) {
      await prisma.incidentEvent.create({
        data: {
          incidentId: incident.id,
          type: IncidentEventType.TRIAGED,
          actorId: operatorUser?.id ?? null,
          actorName: operatorUser?.name ?? 'Operator',
          note: `Triage: priority ${categoryMeta.defaultPriority}, credibility assessed.`,
          createdAt: new Date(occurredAt.getTime() + faker.number.int({ min: 3, max: 10 }) * 60_000),
        },
      });
    }

    incidentCount++;
  }
  console.log(`  ✓ ${incidentCount} sample incidents`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 CEWERS Database Seed\n' + '='.repeat(40));

  // Allow Prisma to insert rows before setting raw PostGIS coordinates
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Lga" ALTER COLUMN "centroid" DROP NOT NULL;
      ALTER TABLE "Ward" ALTER COLUMN "centroid" DROP NOT NULL;
      ALTER TABLE "MiniCommandCentre" ALTER COLUMN "location" DROP NOT NULL;
      ALTER TABLE "Incident" ALTER COLUMN "geo" DROP NOT NULL;
    `);
  } catch (err) {
    // Ignore if already dropped
  }

  await seedLgas();
  await seedWards();
  await seedSops();
  await seedUsers();
  await seedResponders();
  await seedAlertStates();
  await seedSampleIncidents();
  console.log('\n✅ Seed complete.\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
