
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/server/auth';
import AdminUsersManager from './AdminUsersManager';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  try {
    await requireRole(['SUPER_ADMIN']);
  } catch {
    redirect('/admin');
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          User Management
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Create admin accounts and manage roles and account access.
        </p>
      </div>

      <AdminUsersManager />
    </main>
  );
}
