import AdminSessionGuard from './AdminSessionGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminSessionGuard>{children}</AdminSessionGuard>;
}