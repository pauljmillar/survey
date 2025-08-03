import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

interface PlatformAnalyticsData {
  date: string;
  surveysCompleted: number;
  pointsDistributed: number;
  redemptions: number;
  usersActive: number;
}

export function PlatformAnalytics() {
  const [data, setData] = useState<PlatformAnalyticsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totals, setTotals] = useState({
    surveysCompleted: 0,
    pointsDistributed: 0,
    redemptions: 0,
    usersActive: 0,
  });

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/platform-analytics')
      .then(res => res.json())
      .then((analytics: PlatformAnalyticsData[]) => {
        setData(analytics);
        setTotals({
          surveysCompleted: analytics.reduce((a, d) => a + d.surveysCompleted, 0),
          pointsDistributed: analytics.reduce((a, d) => a + d.pointsDistributed, 0),
          redemptions: analytics.reduce((a, d) => a + d.redemptions, 0),
          usersActive: analytics.reduce((a, d) => a + d.usersActive, 0),
        });
      })
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading platform analytics...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!data.length) return <div>No analytics data available.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white dark:bg-black rounded shadow">
      <h2 className="text-xl font-bold mb-4">Platform Analytics Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded text-center">
          <div className="text-2xl font-bold">{totals.surveysCompleted}</div>
          <div className="text-xs text-muted-foreground">Surveys Completed</div>
        </div>
        <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded text-center">
          <div className="text-2xl font-bold">{totals.pointsDistributed}</div>
          <div className="text-xs text-muted-foreground">Points Distributed</div>
        </div>
        <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded text-center">
          <div className="text-2xl font-bold">{totals.redemptions}</div>
          <div className="text-xs text-muted-foreground">Redemptions</div>
        </div>
        <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded text-center">
          <div className="text-2xl font-bold">{totals.usersActive}</div>
          <div className="text-xs text-muted-foreground">Active Users</div>
        </div>
      </div>
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Surveys Completed Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="surveysCompleted" stroke="#6366f1" name="Surveys Completed" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Points Distributed Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="pointsDistributed" fill="#10b981" name="Points Distributed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Redemptions Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="redemptions" fill="#f59e42" name="Redemptions" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Active Users Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="usersActive" stroke="#6366f1" name="Active Users" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 