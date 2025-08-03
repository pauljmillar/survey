import { SurveyAdminGuard } from '@/components/survey-admin/survey-admin-guard';

export default function SurveyAdminDashboard() {
  return (
    <SurveyAdminGuard>
      <div className="max-w-2xl mx-auto mt-12 p-6 bg-white dark:bg-black rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Survey Admin Dashboard</h1>
        <p>Welcome, Survey Admin! Here you can manage surveys, view analytics, and more.</p>
      </div>
    </SurveyAdminGuard>
  );
} 