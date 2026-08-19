/**
 * Benue South — Ward-level Seed Data
 *
 * Ward names per LGA (INEEC registration wards — 11 state / 10 federal on average).
 * Centroids are approximate: LGA centroid + small deterministic offset per ward index.
 *
 * ⚠️ PLACEHOLDER: These coordinates are generated offsets, not surveyed ward
 * centroids. Replace with official INEC ward boundary data when procured.
 *
 * Ward counts (state wards):
 *   Ado 10, Agatu 10, Apa 10, Obi 9, Ogbadibo 10, Ohimini 9,
 *   Oju 10, Okpokwu 11, Otukpo 13  →  ~92 documented here
 */

import type { GeoPoint } from '../types/index';
import { BENUE_SOUTH_LGAS, type LgaSeed } from './lgas';

export type WardSeed = {
  /** Stable code: <LGA>-<n>, e.g. AGATU-04 */
  code: string;
  name: string;
  lgaCode: string;
  centroid: GeoPoint;
};

/**
 * Deterministic offset for a ward within an LGA.
 * Distributes wards in a loose ring around the LGA centroid.
 */
function wardCentroid(lga: LgaSeed, index: number, total: number): GeoPoint {
  const angle = (index / total) * Math.PI * 2;
  const radiusDeg = 0.06 + (index % 3) * 0.02; // ~6-10 km spread
  return {
    lng: lga.centroid.lng + radiusDeg * Math.cos(angle),
    lat: lga.centroid.lat + radiusDeg * Math.sin(angle),
  };
}

const WARD_NAMES: Record<string, string[]> = {
  ADO: [
    'Igumale I',
    'Igumale II',
    'Ekile',
    'Ulayi',
    'Etilo',
    'Ojigo',
    'Apah',
    'Eka-Awoke',
    'Inkiri',
    'Ogbodo',
  ],
  AGATU: [
    'Obagaji',
    'Odugbeho',
    'Egba',
    'Ogbangede',
    'Okpagabi',
    'Ugboku',
    'Aila',
    'Ojantele',
    'Oshigbudu',
    'Enugba',
  ],
  APA: [
    'Ugbokpo I',
    'Ugbokpo II',
    'Iga-Okpaya',
    'Iga-Amaka',
    'Oiji',
    'Edikwu',
    ' Ocholo',
    'Ugbobi',
    'Ugbodion',
    'Auke',
  ],
  OBI: ['Obarike I', 'Obarike II', 'Odropu', 'Igboro', 'Ito-Ada', 'Uwokwu', 'Adoka I', 'Adoka II', 'Ohuhu'],
  OGBADIBO: [
    'Otukpa I',
    'Otukpa II',
    'Orokam',
    'Igumale',
    'Ojigo',
    'Eika-Ohunene',
    'Awaji',
    'Efiowu',
    'Itabono',
    'Ogyobe',
  ],
  OHIMINI: ['Idekpa-Okpiko I', 'Idekpa-Okpiko II', 'Oglewu', 'Onyagede', 'Bantu', 'Mieso', 'Okpiko', 'Ochekwu', 'Adum'],
  OJU: [
    'Oju I',
    'Oju II',
    'Cheme',
    'Abah',
    'Ibilla',
    'Ukpa',
    'Ainu',
    'Edi',
    'Otocha',
    'Oboru',
  ],
  OKPOKWU: [
    'Okpoga I',
    'Okpoga II',
    'Okpoga III',
    'Edumoga I',
    'Edumoga II',
    'Ewulo',
    'Ichama',
    'Otukpa',
    'Ainu-Otobi',
    'Ogbokolo',
    'Ugbokolo',
  ],
  OTUKPO: [
    'Otukpo I',
    'Otukpo II',
    'Otukpo III',
    'Otukpo IV',
    'Akpa',
    'Oglewu',
    'Ugboju',
    'Ochobo',
    'Ekuri',
    'Awume',
    'Apa',
    'Ogidi',
    'Effeche',
  ],
};

export const BENUE_SOUTH_WARDS: WardSeed[] = BENUE_SOUTH_LGAS.flatMap((lga) => {
  const names = WARD_NAMES[lga.code] ?? [];
  return names.map((name, i) => ({
    code: `${lga.code}-${String(i + 1).padStart(2, '0')}`,
    name,
    lgaCode: lga.code,
    centroid: wardCentroid(lga, i, names.length),
  }));
});

export function getWardsByLga(lgaCode: string): WardSeed[] {
  return BENUE_SOUTH_WARDS.filter((w) => w.lgaCode === lgaCode.toUpperCase());
}

export const TOTAL_WARDS = BENUE_SOUTH_WARDS.length;
