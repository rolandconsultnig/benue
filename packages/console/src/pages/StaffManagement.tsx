import { useState } from 'react';
import { useUsers, useCreateUser, useToggleUserActive, useLgas } from '../api/hooks';
import { useAuthStore } from '../store/auth';

const ROLES = ['OPERATOR', 'ANALYST', 'COMMANDER', 'ADMIN', 'CFP', 'CITIZEN'];
const AGENCIES = [
  'NPF',
  'DSS',
  'NSCDC',
  'ARMY_OPWS',
  'SEMA',
  'NEMA',
  'VIGILANTE',
  'FIRE_SERVICE',
  'FRSC',
  'HEALTH',
  'OTHER',
];

export default function StaffManagementPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ phone: string; pass: string; name: string } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('cewers123');
  const [role, setRole] = useState('OPERATOR');
  const [agency, setAgency] = useState('NPF');
  const [lgaId, setLgaId] = useState('');
  const [formError, setFormError] = useState('');

  const { data: users, isLoading } = useUsers(roleFilter || undefined);
  const { data: lgas } = useLgas();
  const createMut = useCreateUser();
  const toggleActiveMut = useToggleUserActive();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await createMut.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        password: password.trim(),
        role,
        agency: agency || undefined,
        lgaId: lgaId || undefined,
      });

      setNewCredentials({
        name: name.trim(),
        phone: phone.trim(),
        pass: password.trim(),
      });

      setName('');
      setPhone('');
      setPassword('cewers123');
      setLgaId('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create staff account.');
    }
  };

  const handleToggle = async (userId: string, currentActive: boolean) => {
    try {
      await toggleActiveMut.mutateAsync({ userId, isActive: !currentActive });
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const filteredUsers = (users || []).filter((u: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-orange-400">
            <span>🛡️</span>
            <span>C2 PERSONNEL & IDENTITY DIRECTORY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Staff & Security Personnel Management
          </h1>
          <p className="text-xs text-slate-400">
            Manage situational dispatchers, lead intelligence analysts, field commanders, and community focal points.
          </p>
        </div>

        <button
          onClick={() => {
            setNewCredentials(null);
            setModalOpen(true);
          }}
          className="btn-primary py-2.5 px-4 text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 self-start sm:self-auto"
        >
          <span>+</span>
          <span>ONBOARD NEW STAFF</span>
        </button>
      </div>

      {/* Roster Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by name, phone or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="c2-input text-xs font-mono"
          />
        </div>

        {/* Role Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setRoleFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              !roleFilter ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            ALL ROLES ({users?.length || 0})
          </button>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                roleFilter === r ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="glass-card border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Personnel</th>
                <th className="py-3 px-4">Contact ID</th>
                <th className="py-3 px-4">Duty Role</th>
                <th className="py-3 px-4">Agency</th>
                <th className="py-3 px-4">Assigned LGA</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Access Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    <span className="inline-block w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-2" />
                    Querying personnel directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No staff records match current filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u: any) => {
                  const roleColors: Record<string, string> = {
                    ADMIN: 'bg-red-500/10 text-red-400 border-red-500/30',
                    COMMANDER: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
                    ANALYST: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                    OPERATOR: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    CFP: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    CITIZEN: 'bg-slate-800 text-slate-400 border-slate-700',
                  };

                  const lgaName = lgas?.find((l) => l.id === u.lgaId)?.name || 'Zone C Central';

                  return (
                    <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">{u.name}</div>
                        <div className="text-[10px] text-slate-500">ID: {u.id.slice(-8)}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-orange-300">
                        {u.phone}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleColors[u.role] || 'border-slate-700 text-slate-400'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {u.agency ? (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                            {u.agency}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {lgaName}
                      </td>
                      <td className="py-3 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            SUSPENDED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-400">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleToggle(u.id, u.isActive)}
                            disabled={toggleActiveMut.isPending}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                              u.isActive
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {u.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-card max-w-lg w-full p-6 md:p-8 border-slate-700 bg-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">Onboard New C2 Personnel</h3>
                  <p className="text-[11px] text-slate-400">Create login credentials for situation room duty</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {newCredentials ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl">
                  ✓
                </div>
                <h4 className="text-base font-bold text-white">Staff Member Created Successfully</h4>
                <p className="text-xs text-slate-300">
                  Provide these credentials to <strong>{newCredentials.name}</strong> to sign in:
                </p>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 uppercase text-[10px]">Phone ID:</span>
                    <div className="text-orange-400 font-bold">{newCredentials.phone}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[10px]">Password:</span>
                    <div className="text-emerald-400 font-bold">{newCredentials.pass}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[10px]">Login URL:</span>
                    <div className="text-slate-300">http://66.45.231.142:4411/login</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setNewCredentials(null);
                    setModalOpen(false);
                  }}
                  className="btn-primary py-2 px-6 text-xs font-mono font-bold w-full"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                {formError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-mono">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 font-mono mb-1 uppercase text-[10px]">Full Name & Rank</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sgt. Isaac Odeh"
                    className="c2-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-mono mb-1 uppercase text-[10px]">Phone ID</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08012345678 or +234..."
                      className="c2-input text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono mb-1 uppercase text-[10px]">Initial Password</label>
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="cewers123"
                      className="c2-input text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-mono mb-1 uppercase text-[10px]">Duty Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="c2-input text-xs font-mono"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono mb-1 uppercase text-[10px]">Security Agency</label>
                    <select
                      value={agency}
                      onChange={(e) => setAgency(e.target.value)}
                      className="c2-input text-xs font-mono"
                    >
                      {AGENCIES.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1 uppercase text-[10px]">Assigned LGA Jurisdiction</label>
                  <select
                    value={lgaId}
                    onChange={(e) => setLgaId(e.target.value)}
                    className="c2-input text-xs font-mono"
                  >
                    <option value="">Zone C Central Command (All LGAs)</option>
                    {lgas?.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} LGA ({l.capital})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMut.isPending}
                    className="btn-primary py-2 px-5 font-mono font-bold"
                  >
                    {createMut.isPending ? 'Creating Account...' : 'Confirm & Create Account →'}
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
