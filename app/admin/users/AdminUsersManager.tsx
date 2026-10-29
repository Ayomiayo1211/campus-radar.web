
'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'EDITOR' | 'REPORTER';
  isActive: boolean;
  createdAt: string;
};

type AdminUsersResponse = {
  error?: string;
  users: AdminUser[];
};

type AdminUserResponse = {
  error?: string;
  user: AdminUser;
};

const roles = [
  { value: 'REPORTER', label: 'Reporter' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];

export default function AdminUsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminUser['role']>('REPORTER');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        cache: 'no-store',
      });

      const data = (await response.json()) as AdminUsersResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Could not load accounts.');
      }

      setUsers(data.users ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load accounts.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = (await response.json()) as AdminUserResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Could not create account.');
      }

      setUsers((current) => [...current, data.user]);
      setName('');
      setEmail('');
      setPassword('');
      setRole('REPORTER');
      setMessage('Account created successfully.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not create account.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateUser(
    user: AdminUser,
    changes: { role?: AdminUser['role']; isActive?: boolean }
  ) {
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, ...changes }),
      });

      const data = (await response.json()) as AdminUserResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Could not update account.');
      }

      setUsers((current) =>
        current.map((item) =>
          item.id === data.user.id ? data.user : item
        )
      );

      setMessage(`Updated ${data.user.name}'s account.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not update account.'
      );
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Create an account
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Use a unique email address and a password of at least 12 characters.
        </p>

        <form onSubmit={createUser} className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="user-name" className="mb-1 block text-sm font-medium">
              Full name
            </label>
            <input
              id="user-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="user-email" className="mb-1 block text-sm font-medium">
              Email address
            </label>
            <input
              id="user-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="user-password" className="mb-1 block text-sm font-medium">
              Temporary password
            </label>
            <input
              id="user-password"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="user-role" className="mb-1 block text-sm font-medium">
              Role
            </label>
            <select
              id="user-role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as AdminUser['role'])
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {roles.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="rounded-lg bg-gray-100 p-4 text-sm text-gray-700">
          {message}
        </p>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Admin accounts
          </h2>
          <button
            type="button"
            onClick={() => void loadUsers()}
            disabled={loading}
            className="text-sm font-medium underline disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-600">Loading accounts...</p>
        ) : users.length === 0 ? (
          <p className="rounded-xl border border-gray-200 p-6 text-sm text-gray-600">
            No accounts found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Account</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="mt-1 text-gray-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        aria-label={`Role for ${user.name}`}
                        value={user.role}
                        onChange={(event) =>
                          void updateUser(user, {
                            role: event.target.value as AdminUser['role'],
                          })
                        }
                        className="rounded-md border border-gray-300 px-2 py-1.5"
                      >
                        {roles.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={
                          user.isActive ? 'text-green-700' : 'text-gray-500'
                        }
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          void updateUser(user, {
                            isActive: !user.isActive,
                          })
                        }
                        className="font-medium underline"
                      >
                        {user.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
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
