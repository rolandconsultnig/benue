import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { BENUE_SOUTH_CENTROID } from '@cewers/shared';
import { useIncidents, useLgas, useAlerts, useResponders } from '../api/hooks';
import {
  alertColor,
  categoryMeta,
  PRIORITY_COLOR,
  STATUS_COLOR,
  timeAgo,
} from '../lib/format';

const FILTER_CATEGORIES = [
  'ALL',
  'ATTACK_IN_PROGRESS',
  'KIDNAPPING',
  'ARMED_GROUP_MOVEMENT',
  'CATTLE_RUSTLING',
  'HIGHWAY_ROBBERY',
  'DISPLACEMENT',
  'CROP_DESTRUCTION',
];

export default function LiveMapPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [showResponders, setShowResponders] = useState(true);
  const [selectedLga, setSelectedLga] = useState<string>('');
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);

  const { data: lgas } = useLgas();
  const { data: alerts } = useAlerts();
  const { data: responders } = useResponders();
  const { data: incidentsData } = useIncidents({
    pageSize: 200,
    status: undefined,
  });

  const incidents = useMemo(() => {
    if (!incidentsData?.items) return [];
    let list = incidentsData.items;
    if (filter !== 'ALL') list = list.filter((i) => i.category === filter);
    if (selectedLga) list = list.filter((i) => i.lgaId === selectedLga);
    // Only show active / non-closed incidents on the map
    return list.filter((i) => !['CLOSED', 'DISMISSED'].includes(i.status));
  }, [incidentsData, filter, selectedLga]);

  return (
    <div className="relative flex h-full w-full select-none overflow-hidden bg-[#070B12]">
      {/* ─── TACTICAL MAP CONTAINER ─────────────────────────────────── */}
      <div className="flex-1 relative h-full w-full">
        <MapContainer
          center={[BENUE_SOUTH_CENTROID.lat, BENUE_SOUTH_CENTROID.lng]}
          zoom={9}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* Incident markers with tactical pulses */}
          {incidents.map((inc) => {
            const color = PRIORITY_COLOR[inc.priority] || '#64748B';
            const cat = categoryMeta(inc.category as any);
            const isP1 = inc.priority === 'P1';

            return (
              <CircleMarker
                key={inc.id}
                center={[inc.geo.lat, inc.geo.lng]}
                radius={isP1 ? 14 : inc.priority === 'P2' ? 10 : 8}
                pathOptions={{
                  color: isP1 ? '#EF4444' : color,
                  fillColor: color,
                  fillOpacity: 0.85,
                  weight: isP1 ? 3 : 2,
                  dashArray: isP1 ? '4, 4' : undefined,
                }}
                eventHandlers={{
                  click: () => setSelectedIncident(inc),
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[240px] text-slate-100 font-sans">
                    <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-700">
                      <span className="font-bold text-xs flex items-center gap-1 text-orange-400">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{inc.reference}</span>
                    </div>

                    <p className="text-xs text-slate-300 mb-3 line-clamp-3">{inc.description}</p>

                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={{
                          background: `${PRIORITY_COLOR[inc.priority]}20`,
                          color: PRIORITY_COLOR[inc.priority],
                          border: `1px solid ${PRIORITY_COLOR[inc.priority]}40`,
                        }}
                      >
                        {inc.priority} PRIORITY
                      </span>

                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={{
                          background: `${STATUS_COLOR[inc.status]}20`,
                          color: STATUS_COLOR[inc.status],
                        }}
                      >
                        {inc.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 font-mono">
                      <span>⏱ {timeAgo(inc.occurredAt)}</span>
                      <span>📍 {inc.lgaId || 'Sector C'}</span>
                    </div>

                    <button
                      onClick={() => navigate(`/incidents/${inc.id}`)}
                      className="btn-primary w-full text-xs py-1.5"
                    >
                      Open Mission Telemetry →
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Responder Units */}
          {showResponders &&
            responders?.map((r) => {
              if (!r.geo) return null;
              return (
                <CircleMarker
                  key={r.id}
                  center={[r.geo.lat, r.geo.lng]}
                  radius={7}
                  pathOptions={{
                    color: '#06B6D4',
                    fillColor: '#0891B2',
                    fillOpacity: 0.75,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[200px] text-slate-100 font-sans">
                      <div className="font-bold text-xs text-cyan-400 flex items-center gap-1.5 mb-1">
                        <span>🚓</span>
                        <span>{r.callsign}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mb-2">
                        {r.agency} • {r.type}
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-500">Status:</span>
                        <span
                          className={`font-bold ${
                            r.status === 'AVAILABLE' ? 'text-emerald-400' : 'text-orange-400'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
        </MapContainer>

        {/* ─── FLOATING TOP RADAR CONTROLS ───────────────────────────── */}
        <div className="absolute top-4 left-4 right-4 z-[500] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Category Filter Chips */}
          <div className="glass-card p-1.5 flex items-center gap-1 pointer-events-auto shadow-2xl border-slate-800 bg-slate-900/90 overflow-x-auto max-w-full">
            {FILTER_CATEGORIES.map((cat) => {
              const active = filter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  {cat === 'ALL' ? '🛡️ ALL SECTORS' : categoryMeta(cat as any)?.label?.split(' ')[0] || cat}
                </button>
              );
            })}
          </div>

          {/* Toggle Controls */}
          <div className="glass-card px-3 py-2 flex items-center gap-3 pointer-events-auto shadow-2xl border-slate-800 bg-slate-900/90 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={showResponders}
                onChange={(e) => setShowResponders(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-orange-500 focus:ring-orange-500"
              />
              <span className="font-mono text-[11px]">Show Units ({responders?.length ?? 0})</span>
            </label>

            <span className="text-slate-700">|</span>

            <span className="font-mono font-bold text-orange-400">
              {incidents.length} Active Targets
            </span>
          </div>
        </div>

        {/* ─── BOTTOM LEFT RADAR TELEMETRY HUD ───────────────────────── */}
        <div className="absolute bottom-6 left-6 z-[500] pointer-events-none">
          <div className="glass-card p-3 border-slate-800/90 bg-slate-950/90 shadow-2xl pointer-events-auto max-w-xs">
            <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider mb-2 flex items-center justify-between">
              <span>RADAR TELEMETRY</span>
              <span className="text-emerald-400 animate-pulse">SWEEP ACTIVE</span>
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">SECTOR:</span>
                <span>BENUE SOUTH (ZONE C)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">COORDS:</span>
                <span>7.33° N, 8.00° E</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">ACTIVE P1:</span>
                <span className="text-red-400 font-bold">
                  {incidents.filter((i) => i.priority === 'P1').length} Critical
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT SIDEBAR: LGA THREAT ROSTER ────────────────────────── */}
      <div className="w-80 bg-[#0A0E1A] border-l border-slate-800/80 overflow-y-auto flex flex-col flex-shrink-0 z-20">
        <div className="p-4 border-b border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs font-mono uppercase tracking-wider text-slate-200">
              LGA Threat Roster
            </h3>
            <span className="text-[10px] font-mono text-orange-400">9 SGI SECTORS</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Filter map target zones by jurisdiction</p>
        </div>

        <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {lgas?.map((lga) => {
            const isSelected = selectedLga === lga.id;
            const alertCol = alertColor(lga.currentAlertLevel);

            return (
              <button
                key={lga.id}
                onClick={() => setSelectedLga(isSelected ? '' : lga.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-orange-500/60 bg-orange-500/10 text-orange-300'
                    : 'border-slate-800/70 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="text-left min-w-0">
                  <div className="font-semibold text-xs text-slate-200 truncate">{lga.name}</div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {lga.openIncidentCount} Active • {lga.wardCount} Wards
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: alertCol }}
                    title={`Alert Level: ${lga.currentAlertLevel}`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Recent Incidents Mini Feed */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/30">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
            Target Stream
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {incidents.slice(0, 5).map((inc) => {
              const cat = categoryMeta(inc.category as any);
              return (
                <button
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className="w-full text-left p-2 rounded bg-slate-950/50 border border-slate-800/60 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-200 flex items-center gap-1.5 truncate">
                      <span>{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                    </span>
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: PRIORITY_COLOR[inc.priority] }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                    <span>{inc.reference}</span>
                    <span>{timeAgo(inc.occurredAt)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
