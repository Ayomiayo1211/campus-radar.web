import { redirect } from 'next/navigation';

import { getSession } from '@/lib/server/auth';
import AdminDashboard from './AdminDashboard';

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  return <AdminDashboard />;
}