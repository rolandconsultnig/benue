/**
 * MIL-STD-2525D Military Symbol Marker for Leaflet.
 * Renders SVG-based tactical symbols (friendly/hostile/neutral/unknown)
 * with proper frame shapes per the standard.
 */

import L from 'leaflet';

export interface MilStdOptions {
  affiliation: 'friendly' | 'hostile' | 'neutral' | 'unknown';
  icon: string;       // Center icon (emoji or short code)
  label?: string;     // Short text label below
  size?: number;
}

const COLORS: Record<string, string> = {
  friendly: '#3B82F6',
  hostile: '#DC2626',
  neutral: '#22C55E',
  unknown: '#EAB308',
};

/**
 * Build a Leaflet DivIcon with an SVG tactical symbol.
 */
export function milStdIcon(opts: MilStdOptions): L.DivIcon {
  const color = COLORS[opts.affiliation] || '#666';
  const sz = opts.size || 40;
  const half = sz / 2;
  const stroke = 2.5;

  let shapePath = '';
  switch (opts.affiliation) {
    case 'friendly': // Circle
      shapePath = `<circle cx="${half}" cy="${half}" r="${half - stroke}" fill="${color}22" stroke="${color}" stroke-width="${stroke}"/>`;
      break;
    case 'hostile': // Diamond
      shapePath = `<polygon points="${half},${stroke} ${sz - stroke},${half} ${half},${sz - stroke} ${stroke},${half}" fill="${color}22" stroke="${color}" stroke-width="${stroke}"/>`;
      break;
    case 'neutral': // Square
      shapePath = `<rect x="${stroke}" y="${stroke}" width="${sz - stroke * 2}" height="${sz - stroke * 2}" fill="${color}22" stroke="${color}" stroke-width="${stroke}"/>`;
      break;
    case 'unknown': // Rounded rect (clover-like)
      shapePath = `<path d="M ${stroke} ${half} Q ${stroke} ${stroke} ${half} ${stroke} L ${sz - stroke} ${stroke} Q ${sz - stroke} ${stroke} ${sz - stroke} ${half} L ${sz - stroke} ${sz - stroke} Q ${sz - stroke} ${sz - stroke} ${half} ${sz - stroke} L ${stroke} ${sz - stroke} Q ${stroke} ${sz - stroke} ${stroke} ${half} Z" fill="${color}22" stroke="${color}" stroke-width="${stroke}"/>`;
      break;
  }

  const labelHtml = opts.label
    ? `<div style="position:absolute;top:${sz + 2}px;left:50%;transform:translateX(-50%);font-size:9px;font-family:monospace;color:${color};text-shadow:0 0 3px #000;white-space:nowrap;font-weight:bold;">${opts.label}</div>`
    : '';

  const html = `
    <div style="position:relative;width:${sz}px;height:${sz + (opts.label ? 14 : 0)}px;">
      <svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}" style="filter:drop-shadow(0 0 4px ${color}66);">
        ${shapePath}
        <text x="${half}" y="${half + 5}" text-anchor="middle" font-size="${sz * 0.4}" fill="${color}" font-family="monospace" font-weight="bold">${opts.icon}</text>
      </svg>
      ${labelHtml}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'mil-std-marker',
    iconSize: [sz, sz + (opts.label ? 14 : 0)],
    iconAnchor: [half, half],
    popupAnchor: [0, -half],
  });
}

/** Map incident category to MIL-STD affiliation. */
export function categoryToAffiliation(category: string): 'friendly' | 'hostile' | 'neutral' | 'unknown' {
  const hostile = ['ATTACK_IN_PROGRESS', 'KIDNAPPING', 'ARMED_GROUP_MOVEMENT', 'CATTLE_RUSTLING', 'HIGHWAY_ROBBERY', 'WEAPON_SIGHTING'];
  if (hostile.includes(category)) return 'hostile';
  if (category === 'DISPLACEMENT') return 'neutral';
  if (category === 'CROP_DESTRUCTION' || category === 'LAND_BOUNDARY_DISPUTE') return 'unknown';
  return 'unknown';
}
