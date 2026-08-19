import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../api/hooks';
import { useAuthStore } from '../store/auth';
import { storeSession } from '../api/client';

const DEMO_ROLES = [
  { role: 'COMMANDER', phone: '+2348000000005', label: 'Enoch (C2 Commander)' },
  { role: 'OPERATOR', phone: '+2348000000003', label: 'Cyril (Ops Dispatcher)' },
  { role: 'ANALYST', phone: '+2348000000004', label: 'Doris (Intel Analyst)' },
  { role: 'ADMIN', phone: '+2348000000006', label: 'Felix (System Admin)' },
];

export default function LoginPage() {
  const [phone, setPhone] = useState('+2348000000006');
  const [password, setPassword] = useState('cewers123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const loginMut = useLogin();
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const performLogin = async (loginPhone: string, loginPass: string) => {
    setError('');
    setLoading(true);
    try {
      const session = await loginMut.mutateAsync({ phone: loginPhone, password: loginPass });
      storeSession(session);
      setUser(session.user);
      navigate('/app', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(phone, password);
  };

  const handleRoleSelect = (rolePhone: string) => {
    setPhone(rolePhone);
    setPassword('cewers123');
    performLogin(rolePhone, 'cewers123');
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-[#070B12] overflow-hidden select-none p-4">
      {/* Background ambient tactical glowing orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Cyber Grid pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Classification Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-orange-400 mb-3 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            BENUE SOUTH SITUATION ROOM • ZONE C
          </div>

          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 flex items-center justify-center text-2xl shadow-xl shadow-orange-500/25 ring-1 ring-white/20">
              🛡️
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">CEWERS C2 PORTAL</h1>
          <p className="text-slate-400 text-xs mt-1">
            Conflict Early Warning & Early Response System
          </p>
        </div>

        {/* Tactical Auth Card */}
        <div className="glass-card p-6 md:p-8 border-slate-800 bg-slate-900/85 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span className="text-orange-400 font-mono">🔒</span> Operator Sign In
            </h2>
            <span className="text-[10px] font-mono text-slate-500 uppercase">256-Bit Encrypted</span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-xs border border-red-500/30 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                Operator Phone ID
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="c2-input font-mono text-xs"
                placeholder="+2348000000000"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                Security Passcode
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="c2-input font-mono text-xs"
                placeholder="••••••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AUTHENTICATING...</span>
                </span>
              ) : (
                'ENTER SITUATION ROOM →'
              )}
            </button>
          </form>

          {/* Quick Demo Operator Roles */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
                Instant Duty Switcher (Click to Login)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Demo: cewers123</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ROLES.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleRoleSelect(r.phone)}
                  disabled={loading}
                  className={`text-left p-2 rounded-lg border transition-all ${
                    phone === r.phone
                      ? 'border-orange-500/50 bg-orange-500/10 text-orange-300'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-[11px] font-bold font-mono text-slate-200">{r.role}</div>
                  <div className="text-[10px] text-slate-500 truncate">{r.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Confidential footer note & link to public portal */}
        <div className="mt-4 text-center space-y-1">
          <p className="text-slate-600 text-[11px] font-mono">
            AUTHORIZED PERSONNEL ONLY • BENUE STATE HOMELAND SECURITY
          </p>
          <a
            href="/"
            className="inline-block text-[11px] font-mono text-orange-400/80 hover:text-orange-300 transition-colors"
          >
            ← Return to Public Early Warning Portal
          </a>
        </div>
      </div>
    </div>
  );
}
