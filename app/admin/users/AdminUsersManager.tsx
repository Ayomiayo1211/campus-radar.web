'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

type Role = 'SUPER_ADMIN' | 'SENIOR_EDITOR' | 'EDITOR' | 'REPORTER';
type Team = 'EDITORIAL' | 'CREATIVE' | 'PHOTOGRAPHY' | 'PODCAST' | 'EVENTS' | 'PARTNERSHIPS';
type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  teams: Team[];
};
type Invitation = { id: string; email: string; role: 'EDITOR' | 'REPORTER'; expires_at: string };
type Result = { error?: string; users?: AdminUser[]; invitations?: Invitation[]; user?: AdminUser; message?: string };

const roles = [
  { value: 'REPORTER', label: 'Reporter' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'SENIOR_EDITOR', label: 'Senior Editor' },
] as const;
const invitationRoles = roles.filter(item => item.value !== 'SENIOR_EDITOR');
const teams: { value: Team; label: string }[] = [
  { value: 'EDITORIAL', label: 'Editorial' },
  { value: 'CREATIVE', label: 'Creative' },
  { value: 'PHOTOGRAPHY', label: 'Photography' },
  { value: 'PODCAST', label: 'Podcast' },
  { value: 'EVENTS', label: 'Events' },
  { value: 'PARTNERSHIPS', label: 'Partnerships' },
];

export default function AdminUsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'EDITOR' | 'REPORTER'>('REPORTER');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await response.json() as Result;
      if (!response.ok) throw new Error(data.error || 'Could not load accounts.');
      setUsers(data.users ?? []);
      setInvitations(data.invitations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await response.json() as Result;
      if (!response.ok) throw new Error(data.error || 'Could not send invitation.');
      setEmail('');
      setRole('REPORTER');
      setMessage(data.message || 'Invitation sent.');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send invitation.');
    } finally {
      setSaving(false);
    }
  }

  async function update(user: AdminUser, changes: { role?: 'EDITOR' | 'REPORTER' | 'SENIOR_EDITOR'; isActive?: boolean; teams?: Team[] }) {
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, ...changes }),
      });
      const data = await response.json() as Result;
      if (!response.ok || !data.user) throw new Error(data.error || 'Could not update account.');
      setUsers(current => current.map(item => item.id === data.user!.id ? data.user! : item));
      setMessage(`Updated ${data.user.name}'s account.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update account.');
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Invite a newsroom member</h2>
        <p className="mt-1 text-sm text-gray-600">
          Enter an email address and assign a platform role. After the invitation is accepted, you can assign the member to one or more teams below.
        </p>
        <form onSubmit={invite} className="mt-6 grid gap-5 sm:grid-cols-[1fr_220px_auto] sm:items-end">
          <div>
            <label htmlFor="user-email" className="mb-1 block text-sm font-medium">Email address</label>
            <input id="user-email" type="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="name@example.com" />
          </div>
          <div>
            <label htmlFor="user-role" className="mb-1 block text-sm font-medium">Platform role</label>
            <select id="user-role" value={role} onChange={event => setRole(event.target.value as 'EDITOR' | 'REPORTER')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
              {invitationRoles.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving} className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
            {saving ? 'Sending...' : 'Send invitation'}
          </button>
        </form>
      </section>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-gray-100 p-4 text-sm text-gray-700">{message}</p>}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Admin accounts</h2>
            <p className="mt-1 text-sm text-gray-500">Platform roles control access. Team assignments describe each member's Campus Radar track.</p>
          </div>
          <button type="button" onClick={() => void loadUsers()} disabled={loading} className="text-sm underline">Refresh</button>
        </div>
        {loading ? <p className="text-sm text-gray-600">Loading accounts...</p> : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Platform role</th>
                  <th className="px-4 py-3">Teams</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-4 py-4">
                      <p className="font-medium">{user.name}</p>
                      <p className="mt-1 text-gray-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      {user.role === 'SUPER_ADMIN' ? 'Master Admin' : (
                        <select value={user.role} onChange={event => void update(user, { role: event.target.value as 'EDITOR' | 'REPORTER' | 'SENIOR_EDITOR' })} className="rounded-md border px-2 py-1.5">
                          {roles.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {user.role === 'SUPER_ADMIN' ? 'All teams' : (
                        <details className="relative">
                          <summary className="cursor-pointer select-none rounded-md border px-3 py-2">
                            {user.teams.length ? `${user.teams.length} assigned` : 'Assign teams'}
                          </summary>
                          <div className="absolute left-0 z-20 mt-1 w-52 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                            {teams.map(team => (
                              <label key={team.value} className="flex cursor-pointer items-center gap-2 py-1.5 text-sm">
                                <input
                                  type="checkbox"
                                  checked={user.teams.includes(team.value)}
                                  onChange={event => {
                                    const next = event.target.checked
                                      ? [...user.teams, team.value]
                                      : user.teams.filter(value => value !== team.value);
                                    void update(user, { teams: next });
                                  }}
                                />
                                {team.label}
                              </label>
                            ))}
                          </div>
                        </details>
                      )}
                      {user.teams.length > 0 && <p className="mt-1 max-w-48 text-xs text-gray-500">{user.teams.map(value => teams.find(team => team.value === value)?.label ?? value).join(', ')}</p>}
                    </td>
                    <td className="px-4 py-4">{user.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="px-4 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                      {user.role === 'SUPER_ADMIN' ? 'Protected account' : (
                        <button type="button" onClick={() => void update(user, { isActive: !user.isActive })} className="underline">
                          {user.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Pending invitations</h2>
        {invitations.length === 0 ? <p className="text-sm text-gray-500">No pending invitations.</p> : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Expires</th></tr>
              </thead>
              <tbody className="divide-y">
                {invitations.map(invitation => (
                  <tr key={invitation.id}>
                    <td className="px-4 py-3">{invitation.email}</td>
                    <td className="px-4 py-3">{invitation.role}</td>
                    <td className="px-4 py-3">{new Date(invitation.expires_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
