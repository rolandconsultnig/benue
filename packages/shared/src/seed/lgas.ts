/**
 * Benue South Senatorial District (Zone C) — Geography Seed
 *
 * 9 LGAs with headquarters and approximate centroids.
 * Coordinates are [longitude, latitude] per GeoJSON convention.
 *
 * Population estimates are indicative planning figures (not census).
 * Ward lists are representative; refine with official INEC ward data.
 *
 * Source for LGA HQ coordinates: approximate, derived from public mapping.
 * These are placeholders pending verification against official boundaries.
 */

import type { GeoPoint } from '../types/index';

export type LgaSeed = {
  code: string;
  name: string;
  capital: string;
  centroid: GeoPoint;
  state: string;
  populationEstimate: number;
  /** Primary threat tags from the proposal (Section 7). */
  primaryThreats: string[];
  /** Customisation note per the proposal. */
  customisation: string;
  highestRisk?: boolean;
};

export const BENUE_SOUTH_LGAS: LgaSeed[] = [
  {
    code: 'ADO',
    name: 'Ado',
    capital: 'Igumale',
    centroid: { lng: 8.2969, lat: 7.0833 },
    state: 'Benue',
    populationEstimate: 180_000,
    primaryThreats: ['Border infiltration', 'Farmer-herder clashes', 'Kidnapping'],
    customisation:
      'Riverine surveillance (Benue river border with Cross River); boat patrols; VSAT comms; cross-border intelligence liaison with Cross River State.',
  },
  {
    code: 'AGATU',
    name: 'Agatu',
    capital: 'Obagaji',
    centroid: { lng: 8.0417, lat: 7.5833 },
    state: 'Benue',
    populationEstimate: 320_000,
    primaryThreats: [
      'Farmer-herder violence (epicentre)',
      'Repeated mass attacks',
      'Protracted displacement',
      'Cattle rustling',
    ],
    customisation:
      'Highest-risk LGA. Highest-density CFP network; reinforced QRF; permanent drone reconnaissance footprint; IDP early-warning linkage; priority CCTV at Odugbeho, Egba, Ogbangede; hardened comms.',
    highestRisk: true,
  },
  {
    code: 'APA',
    name: 'Apa',
    capital: 'Ugbokpo',
    centroid: { lng: 7.9167, lat: 7.4167 },
    state: 'Benue',
    populationEstimate: 200_000,
    primaryThreats: ['Farmer-herder clashes (Agatu spillover)', 'Attacks on returning IDPs', 'Kidnapping'],
    customisation:
      'Reintegration-conflict monitoring; inter-LGA coordination with Agatu; water-point dispute tracking.',
  },
  {
    code: 'OBI',
    name: 'Obi',
    capital: 'Obarike-Ito',
    centroid: { lng: 8.0333, lat: 7.0833 },
    state: 'Benue',
    populationEstimate: 180_000,
    primaryThreats: ['Kidnapping (Oju-Obi, Otukpo-Obi corridors)', 'Farmer-herder tension', 'Highway crime'],
    customisation: 'Highway corridor CCTV + patrol checkpoints; commuter SMS alert system.',
  },
  {
    code: 'OGBADIBO',
    name: 'Ogbadibo',
    capital: 'Otukpa',
    centroid: { lng: 7.7333, lat: 6.9 },
    state: 'Benue',
    populationEstimate: 180_000,
    primaryThreats: ['Boundary/border disputes (Enugu/Ebonyi axis)', 'Kidnapping', 'Cultism', 'Highway robbery'],
    customisation:
      'Border-crossing monitoring; urban (Igumale/Orokam) crime analytics; youth-gang intelligence.',
  },
  {
    code: 'OHIMINI',
    name: 'Ohimini',
    capital: 'Idekpa-Okpiko',
    centroid: { lng: 8.0, lat: 7.3667 },
    state: 'Benue',
    populationEstimate: 120_000,
    primaryThreats: ['Farmer-herder clashes', 'Cattle rustling', 'Inter-communal disputes'],
    customisation: 'Community-dialogue rapid deployment; grazing-route monitoring; coordination with Obi/Oju.',
  },
  {
    code: 'OJU',
    name: 'Oju',
    capital: 'Oju',
    centroid: { lng: 8.4, lat: 7.05 },
    state: 'Benue',
    populationEstimate: 250_000,
    primaryThreats: ['Igede-axis farmer-herder clashes', 'Kidnapping', 'Boundary tension (Cross River)'],
    customisation:
      'Igede-language reporting integration; forest-edge surveillance; coordination with Obi/Ohimini.',
  },
  {
    code: 'OKPOKWU',
    name: 'Okpokwu',
    capital: 'Okpoga',
    centroid: { lng: 7.9667, lat: 7.3167 },
    state: 'Benue',
    populationEstimate: 280_000,
    primaryThreats: ['Highway kidnapping (Otukpo-Okpoga-Enugu)', 'Farmer-herder clashes', 'Cultism'],
    customisation: 'Highway intelligence + patrol; urban youth-crime monitoring (Edumoga/Okpoga).',
  },
  {
    code: 'OTUKPO',
    name: 'Otukpo',
    capital: 'Otukpo',
    centroid: { lng: 8.15, lat: 7.0333 },
    state: 'Benue',
    populationEstimate: 320_000,
    primaryThreats: [
      'District-capital urban crime',
      'Kidnapping',
      'Cultism',
      'Bank-robbery risk',
      'Market/motor-park crime',
    ],
    customisation:
      'Dense urban CCTV grid; bank-robbery response protocol; commercial-centre monitoring; serves as secondary regional command node.',
  },
];

export const BENUE_SOUTH_CENTROID: GeoPoint = { lng: 8.05, lat: 7.2 };

export function getLgaByCode(code: string): LgaSeed | undefined {
  return BENUE_SOUTH_LGAS.find((l) => l.code === code.toUpperCase());
}

export function getLgaByName(name: string): LgaSeed | undefined {
  const lower = name.toLowerCase();
  return BENUE_SOUTH_LGAS.find((l) => l.name.toLowerCase() === lower);
}
