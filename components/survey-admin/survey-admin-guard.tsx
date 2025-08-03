import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function SurveyAdminGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && (!isSignedIn || (userRole !== 'survey_admin' && userRole !== 'system_admin'))) {
      router.replace('/'); // Redirect to home if not authorized
    }
  }, [isLoaded, isSignedIn, userRole, router]);

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn || (userRole !== 'survey_admin' && userRole !== 'system_admin')) {
    return <div className="text-center text-red-600 mt-8">Access denied. Survey admin only.</div>;
  }
  return <>{children}</>;
} 