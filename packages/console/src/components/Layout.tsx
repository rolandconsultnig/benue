import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useLogout, useDashboardKpis } from '../api/hooks';
import { useAlarmStore } from '../store/alarms';
import { launchMonitorWindow } from '../lib/monitor';
import AlarmTicker from './AlarmTicker';

const navItems = [
  { to: '/app', label: 'Operations HUD', icon: '📊', end: true },
  { to: '/c2', label: 'C2 Video Wall ↗', icon: '🖥️', popup: true },
  { to: '/systems', label: 'Monitoring Systems', icon: '🎛️' },
  { to: '/map', label: 'Live Radar Map', icon: '🗺️' },
  { to: '/triage', label: 'Triage Queue', icon: '📋' },
  { to: '/intel', label: 'Field Intel Feed', icon: '📡' },
  { to: '/playbook', label: 'Playbook Engine', icon: '⚡' },
  { to: '/responders', label: 'Force Readiness', icon: '🛡️' },
  { to: '/analytics', label: 'Situation Reports', icon: '📈' },
  { to: '/staff', label: 'Personnel & Staff', icon: '👤' },
  { to: '/', label: 'Public Portal ↗', icon: '🌐' },
];

export default function Layout() {
  const user = useAuthStore((s) => s.user);
  const logoutStore = useAuthStore((s) => s.logout);
  const logoutMut = useLogout();
  const navigate = useNavigate();
  const { data: kpis } = useDashboardKpis();
  const unackCount = useAlarmStore((s) => s.unacknowledgedCount);

  const handleLogout = async () => {
    try {
      await logoutMut.mutateAsync();
    } catch {
      /* ignore */
    }
    logoutStore();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070B12] text-slate-100 select-none">
      {/* Top Telemetry & Alarm Bar */}
      <AlarmTicker />

      <div className="flex flex-1 overflow-hidden">
        {/* Sleek C2 Sidebar */}
        <aside className="w-64 bg-[#0A0E1A] border-r border-slate-800/80 flex flex-col flex-shrink-0 z-30">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/50 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-lg shadow-lg shadow-orange-500/20 ring-1 ring-white/20">
                  🛡️
                </div>
                <div>
                  <div className="font-bold text-sm tracking-wider text-white flex items-center gap-1.5">
                    CEWERS <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">C2</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    Zone C • Benue South
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
              Command Modules
            </div>
            {navItems.map((item) =>
              item.popup ? (
                <button
                  key={item.to}
                  onClick={() => launchMonitorWindow()}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-850 border-l-2 border-transparent text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                  <span className="text-[9px] mono text-orange-400/70">NEW WIN</span>
                </button>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-transparent text-orange-400 border-l-2 border-orange-500 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border-l-2 border-transparent'
                    }`
                  }
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.label}</span>
                  </span>

                  {item.to === '/triage' && kpis && kpis.openIncidents > 0 && (
                    <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                      {kpis.openIncidents}
                    </span>
                  )}

                  {item.to === '/' && unackCount > 0 && (
                    <span className="bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                      {unackCount}
                    </span>
                  )}
                </NavLink>
              ),
            )}
          </nav>

          {/* Quick Threat Level Matrix */}
          {kpis && (
            <div className="p-3 mx-2.5 mb-2 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                <span>Threat Telemetry</span>
                <span className="text-orange-400">DEFCON 3</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">RED</span>
                  <span className="font-mono font-bold text-red-400">{kpis.activeRedAlerts}</span>
                </div>
                <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">ORANGE</span>
                  <span className="font-mono font-bold text-orange-400">{kpis.activeOrangeAlerts}</span>
                </div>
              </div>
            </div>
          )}

          {/* User Profile Footer */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50 flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 truncate">{user?.name}</div>
                  <div className="text-[10px] font-mono text-orange-400/80 uppercase">
                    {user?.role}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                title="Sign Out"
              >
                ⏻
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-[#070B12]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
