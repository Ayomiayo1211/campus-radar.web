import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/server/auth';
import ApplicationsManager from './ApplicationsManager';

export const dynamic = 'force-dynamic';

export default async function AdminApplicationsPage() {
  try {
    await requireRole(['SUPER_ADMIN', 'SENIOR_EDITOR', 'EDITOR']);
  } catch {
    redirect('/admin');
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Campus Radar · Recruitment</p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">Member applications</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">Review applications for the 2026/2027 session. Applicant contact and student details are visible only to authorised newsroom administrators.</p>
      </div>
      <ApplicationsManager />
    </main>
  );
}
