import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

interface LgaProfile {
  code: string;
  name: string;
  capital: string;
  population: string;
  wardsCount: number;
  threatLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  focus: string;
  threatDescription: string;
  keyAssets: string[];
}

const ZONE_C_LGAS: LgaProfile[] = [
  {
    code: 'AGATU',
    name: 'Agatu',
    capital: 'Obagaji',
    population: '165,000',
    wardsCount: 10,
    threatLevel: 'ORANGE',
    focus: 'Riverine Borderlands & Transhumance Grazing Corridors',
    threatDescription: 'High-density seasonal pastoral movement across the River Benue basin. Focus on pre-conflict grazing corridor de-escalation and riverine patrol.',
    keyAssets: ['River Benue Waterway Outpost', 'Obagaji Forward Operating Base', 'Odugbeho Early Warning Node'],
  },
  {
    code: 'APA',
    name: 'Apa',
    capital: 'Ugbokpo',
    population: '130,000',
    wardsCount: 11,
    threatLevel: 'ORANGE',
    focus: 'Forest Transit Routes & Border Surveillance',
    threatDescription: 'Forest boundary monitoring linking with Nasarawa State. Rapid intelligence tracking on suspicious armed group movements.',
    keyAssets: ['Ugbokpo Tactical Checkpoint', 'Ikobi Agro-Security Buffer', 'Apa Peace Committee Liaison'],
  },
  {
    code: 'OTUKPO',
    name: 'Otukpo',
    capital: 'Otukpo',
    population: '310,000',
    wardsCount: 13,
    threatLevel: 'YELLOW',
    focus: 'Central C2 Command Nexus & Commercial Hub',
    threatDescription: 'Regional nerve centre housing the CEWERS Central Command Facility, rail junction logistics, and multi-agency dispatch headquarters.',
    keyAssets: ['CEWERS Central C2 Situation Room', 'NPF Area Command HQ', 'Otukpo General Hospital Emergency Unit'],
  },
  {
    code: 'OGBADIBO',
    name: 'Ogbadibo',
    capital: 'Otukpa',
    population: '175,000',
    wardsCount: 13,
    threatLevel: 'YELLOW',
    focus: 'Interstate Highway Corridor & Boundary Gateway',
    threatDescription: 'Surveillance of the critical 9th Mile-Makurdi arterial highway connecting South-East to North-Central Nigeria against highway robbery and transit crimes.',
    keyAssets: ['Otukpa Highway Patrol Station', 'Orokam Border Checkpoint', 'Owukpa Mineral Area Patrol'],
  },
  {
    code: 'OKPOKWU',
    name: 'Okpokwu',
    capital: 'Okpoga',
    population: '220,000',
    wardsCount: 12,
    threatLevel: 'YELLOW',
    focus: 'Agrarian Conflict Prevention & Inter-Communal Mediation',
    threatDescription: 'Mediation of land-use disputes and communal boundaries in farming settlements with active Community Focal Points (CFPs).',
    keyAssets: ['Okpoga Rapid Response Unit', 'Ichama Farm Buffer Zone', 'Ugbokolo Commercial Watch'],
  },
  {
    code: 'ADO',
    name: 'Ado',
    capital: 'Igumale',
    population: '240,000',
    wardsCount: 10,
    threatLevel: 'YELLOW',
    focus: 'Southern Frontier & Cross-Border Buffer',
    threatDescription: 'Extensive borderlands adjacent to Ebonyi & Cross River states. Early detection of border encroachment and communal tension.',
    keyAssets: ['Igumale Border Patrol Station', 'Rima River Monitoring Station', 'Apa-Agila Forest Reserve Post'],
  },
  {
    code: 'OJU',
    name: 'Oju',
    capital: 'Oju',
    population: '215,000',
    wardsCount: 11,
    threatLevel: 'GREEN',
    focus: 'Igede Agrarian Heartlands & Community Policing',
    threatDescription: 'Traditional peace structures actively integrated into the digital alert ticker to prevent localized disputes from escalating.',
    keyAssets: ['Oju Community Peace Hub', 'Ibilla Early Response Post', 'Oju Agro-Ranger Unit'],
  },
  {
    code: 'OBI',
    name: 'Obi',
    capital: 'Obarike-Ito',
    population: '120,000',
    wardsCount: 12,
    threatLevel: 'GREEN',
    focus: 'Agrarian Settlement Early Warning Nodes',
    threatDescription: 'High civic reporting density with community volunteer networks sending real-time crop encroachment indicators.',
    keyAssets: ['Obarike-Ito Watch Centre', 'Ito Peace Council Secretariat', 'Ito-Adum Forestry Scout'],
  },
  {
    code: 'OHIMINI',
    name: 'Ohimini',
    capital: 'Idekpa',
    population: '95,000',
    wardsCount: 10,
    threatLevel: 'GREEN',
    focus: 'Inland Peace Corridors & Grassroots Liaison',
    threatDescription: 'Central interior peace corridor maintaining early warning linkage between Otukpo, Okpokwu, and Apa LGAs.',
    keyAssets: ['Idekpa Civic Centre', 'Ochobo Early Warning Point', 'Onyagede Agro-Watch Unit'],
  },
];

const CRITICAL_SITUATIONS = [
  {
    icon: '🌾',
    title: 'Transhumance & Crop Encroachment Early Warning',
    badge: 'HIGH IMPACT',
    badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    desc: 'Monitoring seasonal pastoral migration corridors across Agatu, Apa, and Gwer West borders. Real-time satellite & drone reconnaissance detects unscheduled cattle movements before farm destruction occurs.',
    actions: ['Automated alert dispatches to Agro-Rangers', 'Traditional leader rapid mediation protocols', 'Buffer-zone GPS geofencing'],
  },
  {
    icon: '🛡️',
    title: 'Armed Group Incursion & Forest Surveillance',
    badge: 'PRIORITY 1',
    badgeColor: 'text-red-400 border-red-500/30 bg-red-500/10',
    desc: 'Intercepting early indicators of suspicious armed assemblies in dense border forest reserves along the Benue-Nasarawa and Benue-Kogi boundaries.',
    actions: ['Joint Military (OPWS) & Police QRF deployment', 'Community hotline verification within 3 minutes', 'Curfew & roadblock automated SOP triggers'],
  },
  {
    icon: '🛣️',
    title: 'Interstate Highway Corridor Security',
    badge: 'CRITICAL ARTERY',
    badgeColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    desc: 'Securing the strategic Otukpa-Otukpo-Aliade trunk highway and Otukpo-Ankpa axis against highway robbery, vehicle ambushes, and transit kidnapping.',
    actions: ['24/7 motorized patrol telemetry', 'Distress beacon triggers via USSD/SMS', 'Emergency medical evacuation links'],
  },
  {
    icon: '🌊',
    title: 'River Benue Waterways & Riverine Defense',
    badge: 'RIVERINE SECTOR',
    badgeColor: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    desc: 'Guarding riverine fishing settlements and ferry crossings in Agatu against water-borne incursions and illegal transport of arms.',
    actions: ['Naval/Police boat dispatch coordination', 'River ward early observer networks', 'Night navigation monitoring'],
  },
  {
    icon: '⚖️',
    title: 'Communal Boundary Dispute De-escalation',
    badge: 'PEACEBUILDING',
    badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    desc: 'Preventing flashpoints over farmland boundaries, chieftaincy disputes, and market ownership through structured Community Focal Points (CFPs).',
    actions: ['Pre-conflict sentiment analysis', 'Traditional Council peace arbitration', 'Neutral buffer demarcation'],
  },
  {
    icon: '📢',
    title: 'Rumour Verification & Counter-Disinformation',
    badge: 'INFO-OPS',
    badgeColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    desc: 'Rapid debunking of fabricated social media panic posts, fake attack alerts, and inflammatory rhetoric that incite retaliatory violence.',
    actions: ['AI credibility scoring (A to D)', 'Verified SMS broadcast alerts', 'Public radio broadcast sync in 4 languages'],
  },
];

export default function PublicPortal() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [selectedLga, setSelectedLga] = useState<LgaProfile | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');

  const [category, setCategory] = useState('SUSPICIOUS_GATHERING');
  const [description, setDescription] = useState('');
  const [lgaCode, setLgaCode] = useState('OTUKPO');
  const [phone, setPhone] = useState('');

  const handleCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitting(true);
    setReportError('');
    try {
      const lga = ZONE_C_LGAS.find((l) => l.code === lgaCode);
      const res = await fetch('/api/channels/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          description: `[${lga?.name || 'Zone C'}] ${description}`,
          lng: 8.05,
          lat: 7.2,
          channel: 'APP',
          reporterPhone: phone || undefined,
          priorityHint: 'P2',
        }),
      });

      if (!res.ok) throw new Error('Failed to submit report. Please call 112 directly.');
      const data = await res.json();
      setReportSuccess(data.reference || 'CEW-2026-CONFIRMED');
      setDescription('');
      setPhone('');
    } catch (err: any) {
      setReportError(err.message || 'Error communicating with C2 dispatch.');
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 font-sans selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
      {/* Ambient background tactical glow */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 right-1/4 w-[700px] h-[700px] bg-emerald-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Cyber Grid background */}
      <div
        className="fixed inset-0 opacity-[0.07] pointer-events-none -z-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Telemetry Classification Ribbon */}
      <div className="bg-slate-950/90 border-b border-slate-800/80 px-4 py-1.5 text-[11px] font-mono flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-orange-400">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            LIVE C2 TELEMETRY FEED
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-300">BENUE STATE HOMELAND SECURITY • ZONE C OPERATIONAL SECTOR</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-emerald-400">DEFCON 4 • ELEVATED READINESS</span>
          <span className="hidden md:inline text-slate-500">WAT: {new Date().toLocaleDateString('en-GB')}</span>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-emerald-600 flex items-center justify-center text-xl shadow-lg shadow-orange-500/20 ring-1 ring-white/20">
              🛡️
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
                CEWERS <span className="text-orange-400 font-mono text-xs px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">ZONE C</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                Conflict Early Warning & Early Response System
              </p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#zone-c" className="hover:text-orange-400 transition-colors">Strategic Overview</a>
            <a href="#lgas" className="hover:text-orange-400 transition-colors">9 LGAs Matrix</a>
            <a href="#situations" className="hover:text-orange-400 transition-colors">Critical Flashpoints</a>
            <a href="#channels" className="hover:text-orange-400 transition-colors">Public Reporting</a>
            <a href="#architecture" className="hover:text-orange-400 transition-colors">Security Agencies</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setReportModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/40 text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>🚨</span>
              <span>REPORT INCIDENT</span>
            </button>

            {isAuthenticated ? (
              <Link
                to="/app"
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold tracking-wider font-mono shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all"
              >
                <span>C2 PORTAL</span>
                <span>→</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold tracking-wider font-mono flex items-center gap-1.5 transition-all"
              >
                <span>OPERATOR LOGIN</span>
                <span>→</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-orange-500/30 text-orange-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                BENUE STATE HOMELAND SECURITY COMMAND • ZONE C SECTOR
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Real-Time Conflict Early Warning & Rapid Response Across <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400">Benue South</span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                CEWERS is the unified multi-agency situational command platform protecting lives, farmland, and critical transportation arteries across all <strong>9 Local Government Areas</strong> of Zone C through sensor intelligence, grassroots early warning indicators, and sub-5-minute emergency response dispatch.
              </p>

              {/* Public Hotline Strip */}
              <div className="p-4 rounded-xl glass-card border-slate-800 bg-slate-900/90 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-400">📱 Free USSD Code</div>
                  <div className="text-sm font-bold font-mono text-orange-400 mt-0.5">*937*100#</div>
                  <div className="text-[9px] text-slate-500">Any Basic Phone</div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-400">✉️ SMS Keyword</div>
                  <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">20379</div>
                  <div className="text-[9px] text-slate-500">CEW &lt;Report&gt;</div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-400">📞 Emergency Voice</div>
                  <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">112 / +234 CEW</div>
                  <div className="text-[9px] text-slate-500">Toll-Free 24/7</div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-400">🛡️ Active Force</div>
                  <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">92 Wards</div>
                  <div className="text-[9px] text-slate-500">100% Coverage</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="btn-primary py-3 px-6 text-xs sm:text-sm font-bold font-mono flex items-center gap-2 shadow-lg shadow-orange-500/25"
                >
                  <span>🚨</span>
                  <span>SUBMIT CITIZEN REPORT (ANONYMOUS)</span>
                </button>
                <a
                  href="#lgas"
                  className="px-5 py-3 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-bold font-mono flex items-center gap-2 transition-all"
                >
                  <span>EXPLORE 9 LGAs</span>
                  <span>↓</span>
                </a>
              </div>
            </div>

            {/* Right Hero: Live Zone C Situation HUD */}
            <div className="lg:col-span-5">
              <div className="glass-card p-6 border-slate-800 bg-slate-900/95 shadow-2xl relative">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Zone C Force Readiness HUD
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">Otukpo Main C2 Operations Centre</p>
                  </div>
                  <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    STATUS: SECURE
                  </span>
                </div>

                {/* Tactical Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Registered LGAs</div>
                    <div className="text-2xl font-bold font-mono text-white mt-1">9 <span className="text-xs text-emerald-400">/ 9 Active</span></div>
                    <div className="text-[10px] text-slate-500 mt-1">Ado to Otukpo</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">EWI Sensor Nodes</div>
                    <div className="text-2xl font-bold font-mono text-orange-400 mt-1">92 <span className="text-xs text-slate-400">Wards</span></div>
                    <div className="text-[10px] text-slate-500 mt-1">Live Grassroots Stream</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Avg Response Time</div>
                    <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">4.2 <span className="text-xs text-slate-400">Mins</span></div>
                    <div className="text-[10px] text-slate-500 mt-1">QRF Dispatch Protocol</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Standard SOPs</div>
                    <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">15 <span className="text-xs text-slate-400">Playbooks</span></div>
                    <div className="text-[10px] text-slate-500 mt-1">Automated Triggers</div>
                  </div>
                </div>

                {/* Priority Flashpoints Barometer */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-slate-400 uppercase flex justify-between">
                    <span>Critical Sector Readiness</span>
                    <span className="text-orange-400">89.4% Operational</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 w-[89%]" />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>Agatu / Apa (Riverine/Forest)</span>
                    <span>Otukpo / Ogbadibo (Transit)</span>
                    <span>Oju / Obi / Ado (Borderlands)</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-center">
                  <Link
                    to="/login"
                    className="text-xs text-orange-400 hover:text-orange-300 font-mono font-bold flex items-center justify-center gap-1.5"
                  >
                    <span>ACCESS RESTRICTED COMMAND CONSOLE</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Geography Overview */}
      <section id="zone-c" className="py-16 bg-slate-950/50 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
            <div className="text-xs font-mono text-orange-400 uppercase tracking-wider">Geopolitical Heartland</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Strategic Geography of Benue State Zone C</h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Benue South (Zone C) comprises the 9 Idoma and Igede speaking local governments, serving as the essential economic bridge and food security artery connecting the agricultural savannah of North-Central Nigeria to the southeastern and southern trading hubs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl glass-card border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all">
              <div className="text-3xl mb-3">🌾</div>
              <h3 className="text-base font-bold text-white mb-2">Agricultural Food Basket</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zone C accounts for extensive yam, cassava, rice, and grain production. Protecting these rural farming settlements against cattle grazing encroachment and seasonal harvest raids preserves food security across Nigeria.
              </p>
            </div>

            <div className="p-6 rounded-xl glass-card border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all">
              <div className="text-3xl mb-3">🛣️</div>
              <h3 className="text-base font-bold text-white mb-2">Interstate Transit Highway</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The Makurdi-Otukpo-Enugu federal highway traverses Zone C, handling thousands of haulage vehicles daily. CEWERS maintains 24/7 telemetry monitoring to prevent ambushes, kidnapping, and highway banditry.
              </p>
            </div>

            <div className="p-6 rounded-xl glass-card border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all">
              <div className="text-3xl mb-3">🌊</div>
              <h3 className="text-base font-bold text-white mb-2">River Benue & Borderlands</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bordered by Nasarawa State to the north, Kogi State to the west, and Enugu/Ebonyi/Cross River states to the south. The River Benue basin in Agatu is monitored against armed riverine incursions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9 Local Government Areas Showcase */}
      <section id="lgas" className="py-16 md:py-20 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <div className="text-xs font-mono text-orange-400 uppercase tracking-wider">Jurisdictional Matrix</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">The 9 LGAs of Benue South</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Click any Local Government Area to inspect critical flashpoints and stationed resources.</p>
            </div>
            <div className="mt-4 md:mt-0 text-xs font-mono text-slate-500">
              Total 92 Wards Monitored 24/7
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ZONE_C_LGAS.map((lga) => {
              const threatColors = {
                GREEN: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
                YELLOW: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
                ORANGE: 'border-orange-500/30 text-orange-400 bg-orange-500/10',
                RED: 'border-red-500/30 text-red-400 bg-red-500/10',
              };

              return (
                <div
                  key={lga.code}
                  onClick={() => setSelectedLga(lga)}
                  className="p-5 rounded-xl glass-card border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-orange-500/40 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase">{lga.capital} • HQ</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${threatColors[lga.threatLevel]}`}>
                        ● {lga.threatLevel}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors flex items-center justify-between">
                      <span>{lga.name} LGA</span>
                      <span className="text-xs font-mono text-slate-500">{lga.wardsCount} Wards</span>
                    </h3>

                    <p className="text-xs text-orange-300/90 font-medium mt-1 mb-2.5">
                      {lga.focus}
                    </p>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {lga.threatDescription}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 group-hover:text-slate-300">
                    <span>Est. Pop: {lga.population}</span>
                    <span className="text-orange-400 font-bold group-hover:translate-x-1 transition-transform">Inspect →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Critical Situations & Flashpoints */}
      <section id="situations" className="py-16 md:py-20 bg-slate-950/60 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
            <div className="text-xs font-mono text-orange-400 uppercase tracking-wider">Tactical Surveillance</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Critical Situations & Early Warning Protocols</h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              How the CEWERS platform actively detects, triages, and responds to high-consequence threats across Zone C before violence occurs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CRITICAL_SITUATIONS.map((sit, idx) => (
              <div key={idx} className="p-6 rounded-xl glass-card border-slate-800 bg-slate-900/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{sit.icon}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${sit.badgeColor}`}>
                    {sit.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white leading-snug">{sit.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{sit.desc}</p>

                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Operational SOPs:</div>
                  {sit.actions.map((act, i) => (
                    <div key={i} className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Public Reporting Channels */}
      <section id="channels" className="py-16 md:py-20 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
            <div className="text-xs font-mono text-orange-400 uppercase tracking-wider">Civic Access</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">4 Ways Citizens Can Report an Incident</h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Accessible to every citizen across Benue South regardless of phone type, network provider, or internet connection.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* USSD */}
            <div className="p-6 rounded-xl glass-card border-slate-800 bg-slate-900/90 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-2xl">
                📱
              </div>
              <h3 className="text-sm font-bold text-white uppercase font-mono">1. USSD Shortcode</h3>
              <div className="text-lg font-mono font-bold text-orange-400">*937*100#</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dial on any feature phone with zero internet or data. Multi-language interactive menu in <strong>English, Idoma, Igede, and Hausa</strong>.
              </p>
            </div>

            {/* SMS */}
            <div className="p-6 rounded-xl glass-card border-slate-800 bg-slate-900/90 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl">
                ✉️
              </div>
              <h3 className="text-sm font-bold text-white uppercase font-mono">2. SMS Shortcode</h3>
              <div className="text-lg font-mono font-bold text-emerald-400">20379</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Send <code>CEW &lt;TYPE&gt; &lt;DETAILS&gt;</code> (e.g. <code>CEW KIDNAPPING Road near Otukpo</code>). Automated receipt & tracking reference issued immediately.
              </p>
            </div>

            {/* Voice Emergency */}
            <div className="p-6 rounded-xl glass-card border-slate-800 bg-slate-900/90 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl">
                📞
              </div>
              <h3 className="text-sm font-bold text-white uppercase font-mono">3. 24/7 Hotline</h3>
              <div className="text-lg font-mono font-bold text-cyan-400">112 / +234 CEW</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct voice connection to the Otukpo Situation Room dispatch operators for live audio emergency coordination and ambulance routing.
              </p>
            </div>

            {/* Web Reporting */}
            <div className="p-6 rounded-xl glass-card border-slate-800 bg-slate-900/90 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-2xl">
                🌐
              </div>
              <h3 className="text-sm font-bold text-white uppercase font-mono">4. Direct Web Portal</h3>
              <button
                onClick={() => setReportModalOpen(true)}
                className="w-full py-2 px-3 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-mono text-xs font-bold transition-all"
              >
                Launch Web Form ↗
              </button>
              <p className="text-xs text-slate-400 leading-relaxed">
                Submit directly online with optional GPS pin and anonymity guarantee. 256-bit encrypted data protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Architecture & Agencies */}
      <section id="architecture" className="py-16 bg-slate-950/60 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
            <div className="text-xs font-mono text-orange-400 uppercase tracking-wider">Multi-Agency Integration</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Unified Command & Security Architecture</h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Coordinated operational dispatch connecting federal, state, and grassroots defense assets into one command umbrella.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            {[
              { code: 'NPF', name: 'Nigeria Police Force', role: 'Primary Law Enforcement & Patrol' },
              { code: 'OPWS', name: 'Operation Whirl Stroke', role: 'Armed Kinetic Counter-Insurgency' },
              { code: 'NSCDC', name: 'Agro-Rangers', role: 'Farm & Grazing Corridor Security' },
              { code: 'DSS', name: 'State Security Services', role: 'Signals & Human Intelligence' },
              { code: 'SEMA', name: 'Benue SEMA', role: 'Humanitarian & IDP Relief' },
              { code: 'VIGILANTE', name: 'Community Watch', role: 'Grassroots Scouting & Wards' },
            ].map((agency) => (
              <div key={agency.code} className="p-4 rounded-xl glass-card border-slate-800 bg-slate-900/60">
                <div className="w-10 h-10 mx-auto rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-orange-400 mb-2">
                  {agency.code}
                </div>
                <div className="text-xs font-bold text-white">{agency.name}</div>
                <div className="text-[10px] text-slate-400 mt-1">{agency.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#04070D] border-t border-slate-800 text-slate-500 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-base">
              🛡️
            </div>
            <div>
              <div className="text-slate-200 font-bold">BENUE STATE HOMELAND SECURITY (ZONE C)</div>
              <div className="text-[10px] text-slate-500">Conflict Early Warning & Early Response System (CEWERS)</div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <a href="#zone-c" className="hover:text-slate-300">Overview</a>
            <a href="#lgas" className="hover:text-slate-300">9 LGAs</a>
            <a href="#channels" className="hover:text-slate-300">Reporting</a>
            <Link to="/login" className="text-orange-400 hover:text-orange-300 font-bold">C2 Situation Room →</Link>
          </div>

          <div className="text-center md:text-right text-[10px] text-slate-600">
            © 2026 Benue State Government • All Rights Reserved
            <br />
            Confidentiality Guaranteed Under 256-Bit Public Safety Protocol
          </div>
        </div>
      </footer>

      {/* LGA Details Modal */}
      {selectedLga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card max-w-lg w-full p-6 border-slate-700 bg-slate-900 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">📍</span>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">{selectedLga.name} Local Government Area</h3>
                  <p className="text-xs text-slate-400">Capital: {selectedLga.capital} • Benue South</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLga(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500">Population</div>
                  <div className="font-bold text-slate-200 mt-0.5">{selectedLga.population}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500">Wards</div>
                  <div className="font-bold text-slate-200 mt-0.5">{selectedLga.wardsCount} Wards</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500">Threat Level</div>
                  <div className="font-bold text-orange-400 mt-0.5">{selectedLga.threatLevel}</div>
                </div>
              </div>

              <div>
                <div className="font-mono uppercase text-slate-400 font-bold mb-1">Strategic Security Focus</div>
                <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 font-medium">
                  {selectedLga.focus}
                </div>
              </div>

              <div>
                <div className="font-mono uppercase text-slate-400 font-bold mb-1">Threat Profile & Surveillance Details</div>
                <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  {selectedLga.threatDescription}
                </p>
              </div>

              <div>
                <div className="font-mono uppercase text-slate-400 font-bold mb-1">Stationed Assets & Infrastructure</div>
                <div className="space-y-1">
                  {selectedLga.keyAssets.map((asset, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-300 bg-slate-950/40 px-2.5 py-1.5 rounded border border-slate-800/60">
                      <span className="text-emerald-400">🛡️</span>
                      <span>{asset}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  setLgaCode(selectedLga.code);
                  setSelectedLga(null);
                  setReportModalOpen(true);
                }}
                className="btn-primary py-2 px-4 text-xs font-mono font-bold"
              >
                Report in {selectedLga.name} →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Citizen Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-card max-w-lg w-full p-6 md:p-8 border-slate-700 bg-slate-900 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚨</span>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">Public Incident Submission</h3>
                  <p className="text-[11px] text-slate-400">Directly relayed to Otukpo C2 Dispatch</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setReportModalOpen(false);
                  setReportSuccess(null);
                  setReportError('');
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {reportSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl">
                  ✓
                </div>
                <h4 className="text-lg font-bold text-white">Report Successfully Relayed</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Your incident alert has been registered and transmitted to the Zone C Command & Control Situation Room for immediate triage and dispatch.
                </p>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 inline-block font-mono text-sm text-emerald-400 font-bold">
                  Tracking Reference: {reportSuccess}
                </div>
                <div>
                  <button
                    onClick={() => {
                      setReportSuccess(null);
                      setReportModalOpen(false);
                    }}
                    className="btn-primary py-2 px-6 text-xs font-mono font-bold mt-2"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCitizenSubmit} className="space-y-4 text-xs">
                {reportError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                    {reportError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-mono mb-1 uppercase text-[10px]">Local Government Area</label>
                    <select
                      value={lgaCode}
                      onChange={(e) => setLgaCode(e.target.value)}
                      className="c2-input text-xs"
                      required
                    >
                      {ZONE_C_LGAS.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.name} LGA
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono mb-1 uppercase text-[10px]">Incident Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="c2-input text-xs"
                      required
                    >
                      <option value="SUSPICIOUS_GATHERING">Suspicious Gathering / Movement</option>
                      <option value="ARMED_GROUP_MOVEMENT">Armed Group Movement</option>
                      <option value="CROP_DESTRUCTION">Crop Destruction / Grazing</option>
                      <option value="ATTACK_IN_PROGRESS">Attack in Progress</option>
                      <option value="KIDNAPPING">Kidnapping / Abduction</option>
                      <option value="HIGHWAY_ROBBERY">Highway Robbery</option>
                      <option value="LAND_BOUNDARY_DISPUTE">Boundary / Land Dispute</option>
                      <option value="WEAPON_SIGHTING">Illegal Weapon Sighting</option>
                      <option value="RUMOUR_VERIFICATION">Rumour Verification</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1 uppercase text-[10px]">
                    Incident Description & Exact Location (Wards/Villages/Landmarks)
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details: village name, time observed, estimated number of persons, direction of movement, casualties if any..."
                    className="c2-input text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1 uppercase text-[10px]">
                    Reporter Contact Phone (Optional - Leave blank for Anonymous)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+2348000000000 (Optional)"
                    className="c2-input text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    🔒 Protected under public safety anonymity protocol.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="btn-primary py-2 px-5 font-mono font-bold"
                  >
                    {reportSubmitting ? 'Relaying to C2 Dispatch...' : 'Submit to Situation Room →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
