import { SystemAdminGuard } from '@/components/system-admin/system-admin-guard';

export default function SystemAdminDashboard() {
  return (
    <SystemAdminGuard>
      <div className="max-w-2xl mx-auto mt-12 p-6 bg-white dark:bg-black rounded shadow">
        <h1 className="text-2xl font-bold mb-4">System Admin Dashboard</h1>
        <p>Welcome, System Admin! Here you can manage users, offers, analytics, and more.</p>
      </div>
    </SystemAdminGuard>
  );
} 