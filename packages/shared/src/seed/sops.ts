/**
 * The 15 scenario-based Standard Operating Procedures (proposal Section 6.4).
 * Each SOP defines trigger conditions, the response tier, modalities, agencies,
 * and an ordered list of response steps. Used by the console to surface the
 * relevant SOP to the operator when an incident matches its trigger.
 */

// Enum values are used as string literals in the seed data below.
// Types are relaxed to `string` to avoid enum-to-string-literal friction.

export type SopSeed = {
  code: string; // SOP-01 .. SOP-15
  title: string;
  /** Incident categories that should surface this SOP. */
  triggers: readonly string[];
  defaultTier: string;
  modalities: readonly string[];
  leadAgency: string;
  supportAgencies: readonly string[];
  steps: string[];
};

export const SOPS: SopSeed[] = [
  {
    code: 'SOP-01',
    title: 'Active Attack on a Community',
    triggers: ["ATTACK_IN_PROGRESS", "ARMED_GROUP_MOVEMENT"],
    defaultTier: "TIER_3_STATE",
    modalities: ["KINETIC", "HUMANITARIAN", "PUBLIC_ALERT"],
    leadAgency: 'ARMY_OPWS',
    supportAgencies: ['NPF', 'NSCDC', 'SEMA'],
    steps: [
      'Confirm location, scale, and number of attackers via CFPs, drone recon, and secondary reports.',
      'Issue immediate public warning to neighbouring villages (geo-SMS + radio + town crier).',
      'Dispatch nearest QRF and request Army (OPWS) reinforcement; establish cordon to contain attackers.',
      'Activate humanitarian response: SEMA pre-positions shelters; evacuate vulnerable populations.',
      'Establish casualty collection point; route ambulances.',
      'Convene Crisis Management Team (Deputy Governor / Security Adviser) in State Situation Room.',
      'Secure scene post-incident for evidence preservation and investigation.',
      'Conduct after-action review within 72 hours.',
    ],
  },
  {
    code: 'SOP-02',
    title: 'Kidnapping / Hostage Incident',
    triggers: ["KIDNAPPING"],
    defaultTier: "TIER_2_LGA",
    modalities: ["KINETIC", "COUNTER_INFO"],
    leadAgency: 'NPF',
    supportAgencies: ['DSS', 'NSCDC'],
    steps: [
      'Verify victim identity, last-known location, and suspected captor route.',
      'Establish IRT (Police Anti-Kidnap) lead; DSS provides intelligence on suspect networks.',
      'Cordon likely egress routes; deploy QRF to ambush points on forest trails.',
      'Coordinate with telecom providers for cell-tower triangulation.',
      'Manage family communication via dedicated officer; discourage uncoordinated ransom payment.',
      'Counter misinformation: suppress rumour that could spread panic or tip off captors.',
    ],
  },
  {
    code: 'SOP-03',
    title: 'Mass Displacement / IDP Influx',
    triggers: ["DISPLACEMENT"],
    defaultTier: "TIER_3_STATE",
    modalities: ["HUMANITARIAN"],
    leadAgency: 'SEMA',
    supportAgencies: ['NEMA', 'NPF', 'HEALTH'],
    steps: [
      'Estimate displaced population, origin, and destination camp via CFPs and drone overflight.',
      'Identify or open reception camp; pre-position water, food, shelter, medical supplies.',
      'Deploy SEMA/NEMA field team; register displaced households.',
      'Establish security perimeter at camp (NPF/NSCDC).',
      'Alert health partners for outbreak surveillance (measles, cholera).',
      'Link unaccompanied minors and GBV survivors to protection partners.',
    ],
  },
  {
    code: 'SOP-04',
    title: 'Farmer-Herder Clash (Early Stage)',
    triggers: ["CROP_DESTRUCTION"],
    defaultTier: "TIER_1_LOCAL",
    modalities: ["MEDIATION", "PUBLIC_ALERT"],
    leadAgency: 'NPF',
    supportAgencies: ['VIGILANTE'],
    steps: [
      'Deploy DPO + Local Peace Committee + traditional rulers to the dispute site within 60 minutes.',
      'Separate parties; establish temporary safe zone for dialogue.',
      'Convene farmer and herder representatives; document grievance (crops, water, route).',
      'Mediate agreement; record in CEWERS with geo-tag and parties.',
      'If mediation fails or violence erupts, escalate to SOP-01.',
    ],
  },
  {
    code: 'SOP-05',
    title: 'Cattle Rustling Report',
    triggers: ["CATTLE_RUSTLING"],
    defaultTier: "TIER_2_LGA",
    modalities: ["KINETIC"],
    leadAgency: 'NPF',
    supportAgencies: ['NSCDC', 'VIGILANTE', 'ARMY_OPWS'],
    steps: [
      'Record number of cattle, suspected rustlers, direction of movement, and weapons seen.',
      'Dispatch QRF + vigilante team on rustlers likely route; alert neighbouring LGAs.',
      'Request Army (OPWS) support if rustlers are heavily armed or >20 in number.',
      'Establish checkpoints on egress roads and forest trails.',
      'Recover livestock; return to owners; document for prosecution.',
    ],
  },
  {
    code: 'SOP-06',
    title: 'Highway Ambush / Roadblock',
    triggers: ["HIGHWAY_ROBBERY"],
    defaultTier: "TIER_2_LGA",
    modalities: ["KINETIC", "PUBLIC_ALERT"],
    leadAgency: 'NPF',
    supportAgencies: ['FRSC', 'NSCDC'],
    steps: [
      'Confirm location and direction of ambush; issue geo-SMS alert to commuters on that corridor.',
      'Dispatch highway patrol from both ends of the corridor to encircle.',
      'FRSC manages traffic; divert vehicles to safe alternative route.',
      'Pursue perpetrators; secure scene; evacuate casualties.',
    ],
  },
  {
    code: 'SOP-07',
    title: 'Inter-Communal Violence',
    triggers: ["LAND_BOUNDARY_DISPUTE", "THREATS_INCITEMENT"],
    defaultTier: "TIER_2_LGA",
    modalities: ["MEDIATION", "KINETIC", "PUBLIC_ALERT"],
    leadAgency: 'NPF',
    supportAgencies: ['NSCDC', 'VIGILANTE'],
    steps: [
      'Deploy QRF to separate communities; establish buffer zone.',
      'Convene traditional rulers from both communities + LGA Chairman.',
      'Identify and arrest instigators; counter incitement on social media.',
      'Mediate root cause (land, chieftaincy); document agreement.',
    ],
  },
  {
    code: 'SOP-08',
    title: 'VIP / Convoy Threat',
    triggers: [],
    defaultTier: "TIER_3_STATE",
    modalities: ["KINETIC"],
    leadAgency: 'NPF',
    supportAgencies: ['DSS', 'NSCDC'],
    steps: [
      'Confirm VIP location and threat credibility via DSS.',
      'Reroute convoy to safe location; deploy close-protection detail.',
      'Neutralise or apprehend threat actors.',
      'Brief VIP principal; coordinate with destination security.',
    ],
  },
  {
    code: 'SOP-09',
    title: 'Civil Unrest / Protest',
    triggers: ["SUSPICIOUS_GATHERING"],
    defaultTier: "TIER_2_LGA",
    modalities: ["MEDIATION", "COUNTER_INFO"],
    leadAgency: 'NPF',
    supportAgencies: ['NSCDC'],
    steps: [
      'Deploy observers; assess whether protest is lawful or escalating.',
      'Engage protest leaders to identify and route the march safely.',
      'Maintain crowd-control posture without provocation.',
      'Counter misinformation that could trigger violence.',
      'Arrest only those committing violence; document all use of force.',
    ],
  },
  {
    code: 'SOP-10',
    title: 'Communication Network Outage',
    triggers: [],
    defaultTier: "TIER_2_LGA",
    modalities: ["PUBLIC_ALERT"],
    leadAgency: 'NPF',
    supportAgencies: ['NSCDC', 'OTHER'],
    steps: [
      'Detect outage via radio-net silence or reporter drop-off.',
      'Activate VHF/UHF radio and VSAT satellite as primary comms for affected area.',
      'Dispatch motorcycle couriers to CFPs in the blackout zone for situational update.',
      'Engage telecom provider to restore; treat as suspicious until cleared.',
    ],
  },
  {
    code: 'SOP-11',
    title: 'GBV / Protection Incident',
    triggers: ["GBV"],
    defaultTier: "TIER_2_LGA",
    modalities: ["KINETIC", "HUMANITARIAN"],
    leadAgency: 'NPF',
    supportAgencies: ['HEALTH', 'SEMA'],
    steps: [
      'Deploy female officer to survivor; ensure safety and confidentiality.',
      'Route survivor to medical care and GBV support partner within 72 hours.',
      'Preserve evidence; identify and arrest perpetrator.',
      'Do not disclose survivor identity in any log or alert.',
    ],
  },
  {
    code: 'SOP-12',
    title: 'Drone / Surveillance Deployment',
    triggers: [],
    defaultTier: "TIER_1_LOCAL",
    modalities: [],
    leadAgency: 'NSCDC',
    supportAgencies: ['NPF', 'ARMY_OPWS'],
    steps: [
      'Confirm tasking: target area, objective (recon / search-rescue / post-incident assessment).',
      'Launch UAV; establish ground control and video feed to Mini Command Centre + State HQ.',
      'Stream geo-tagged footage to the COP map in real time.',
      'Log all imagery as evidence; redact civilian faces where required.',
    ],
  },
  {
    code: 'SOP-13',
    title: 'Media & Information Management',
    triggers: [],
    defaultTier: "TIER_1_LOCAL",
    modalities: ["COUNTER_INFO"],
    leadAgency: 'NPF',
    supportAgencies: ['OTHER'],
    steps: [
      'Verify facts before any public statement; coordinate single authoritative voice.',
      'Issue timely, factual updates to counter rumour and panic.',
      'Monitor social media for incitement and misinformation; rebuttals within 30 minutes.',
      'Brief traditional and religious leaders to reinforce accurate messaging.',
    ],
  },
  {
    code: 'SOP-14',
    title: 'Inter-Agency Handover & Deconfliction',
    triggers: [],
    defaultTier: "TIER_1_LOCAL",
    modalities: [],
    leadAgency: 'NPF',
    supportAgencies: ['DSS', 'NSCDC', 'ARMY_OPWS'],
    steps: [
      'Identify lead agency per incident type (see SOP-01 to SOP-13).',
      'Handover logged in CEWERS with timestamp, transferring agency, receiving agency.',
      'Deconflict simultaneous operations via Fusion Cell to avoid blue-on-blue.',
      'Maintain shared COP throughout the handover.',
    ],
  },
  {
    code: 'SOP-15',
    title: 'After-Action Review',
    triggers: [],
    defaultTier: "TIER_1_LOCAL",
    modalities: [],
    leadAgency: 'NPF',
    supportAgencies: [],
    steps: [
      'Convene all participating agencies within 72 hours of incident closure.',
      'Reconstruct timeline from CEWERS audit log and incident events.',
      'Identify what worked, what failed, and corrective actions.',
      'Update relevant SOP; circulate lessons to all Mini Command Centres.',
    ],
  },
];

export function sopsForCategory(category: string): SopSeed[] {
  return SOPS.filter((s) => s.triggers.includes(category));
}
