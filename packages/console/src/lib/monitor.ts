/**
 * Monitoring Systems — registry + dedicated-window launcher.
 *
 * Each monitoring system (drone, cameras, trespass, gunshot, metal detection)
 * runs in its own browser window so operators can place it on a wall display
 * independently of the main console.
 */

export type MonitorSystemId = 'drone' | 'camera' | 'trespass' | 'gunshot' | 'metal';

export const MONITOR_SYSTEMS: Record<
  MonitorSystemId,
  { label: string; short: string; icon: string; code: string; color: string; desc: string; sensors: number }
> = {
  drone: {
    label: 'DRONE MONITORING',
    short: 'Drones',
    icon: '🛩️',
    code: 'UAS-01',
    color: '#22D3EE',
    desc: 'Unmanned aerial surveillance — patrol tracks, EO/IR feeds, battery & link telemetry across the district.',
    sensors: 3,
  },
  camera: {
    label: 'CAMERA MONITORING',
    short: 'Cameras',
    icon: '📹',
    code: 'CCTV-GRID',
    color: '#60A5FA',
    desc: 'Urban CCTV grid — Otukpo commercial node, highway checkpoints and market junction live feeds.',
    sensors: 6,
  },
  trespass: {
    label: 'TRESPASS MONITORING',
    short: 'Trespass',
    icon: '🚧',
    code: 'GEOFENCE',
    color: '#F59E0B',
    desc: 'Geofence & beam-sensor perimeter watch over farmland belts, forest edges and border crossings.',
    sensors: 24,
  },
  gunshot: {
    label: 'GUNSHOT DETECTION',
    short: 'Gunshot',
    icon: '💥',
    code: 'ACOUSTIC-DS',
    color: '#EF4444',
    desc: 'Acoustic sensor network — muzzle-blast classification, bearing triangulation and instant location cueing.',
    sensors: 6,
  },
  metal: {
    label: 'METAL DETECTION',
    short: 'Metal',
    icon: '🧲',
    code: 'MDI-GATE',
    color: '#A78BFA',
    desc: 'Walk-through & vehicle scanning gates — weapon-profile alerts at motor parks, markets and checkpoints.',
    sensors: 4,
  },
};

export const MONITOR_SYSTEM_IDS = Object.keys(MONITOR_SYSTEMS) as MonitorSystemId[];

/** Open a monitoring display (or the C2 wall) in its own centered browser window. */
export function launchMonitorWindow(systemId?: MonitorSystemId): Window | null {
  const path = systemId ? `/systems/${systemId}` : '/c2';
  const name = systemId ? `cewers-sys-${systemId}` : 'cewers-c2-wall';

  // Named windows: re-clicking a launcher focuses the existing display
  // instead of stacking duplicates on the wall.
  const existing = window.open('', name);
  if (existing && !existing.closed && existing.location.pathname === path) {
    existing.focus();
    return existing;
  }

  const w = Math.min(1680, window.screen.availWidth - 80);
  const h = Math.min(960, window.screen.availHeight - 80);
  const left = Math.max(0, (window.screen.availWidth - w) / 2);
  const top = Math.max(0, (window.screen.availHeight - h) / 2);
  const win = window.open(path, name, `popup=yes,width=${w},height=${h},left=${Math.round(left)},top=${Math.round(top)}`);
  if (win) win.focus();
  return win;
}
