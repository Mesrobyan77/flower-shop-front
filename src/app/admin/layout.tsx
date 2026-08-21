import { Providers } from '@/app/providers';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata = { title: 'Admin' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AdminShell>{children}</AdminShell>
    </Providers>
  );
}
