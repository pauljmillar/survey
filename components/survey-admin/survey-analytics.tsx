import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface AnalyticsData {
  surveyTitle: string;
  completionRate: number;
  avgResponseQuality: number;
  completions: number;
  dropouts: number;
}

export function SurveyAnalytics() {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/surveys/analytics')
      .then(res => res.json())
      .then(setData)
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  function exportCSV() {
    const header = 'Survey Title,Completion Rate,Avg Response Quality,Completions,Dropouts\n';
    const rows = data.map(d =>
      [d.surveyTitle, d.completionRate, d.avgResponseQuality, d.completions, d.dropouts].join(',')
    );
    const csv = header + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'survey-analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'survey-analytics.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div>Loading analytics...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!data.length) return <div>No analytics data available.</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white dark:bg-black rounded shadow">
      <h2 className="text-xl font-bold mb-4">Survey Performance Analytics</h2>
      <div className="flex gap-2 mb-4">
        <Button onClick={exportCSV} variant="outline">Export CSV</Button>
        <Button onClick={exportJSON} variant="outline">Export JSON</Button>
      </div>
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Completion Rate by Survey</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="surveyTitle" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="completionRate" fill="#6366f1" name="Completion Rate (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Average Response Quality</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="surveyTitle" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="avgResponseQuality" fill="#10b981" name="Avg Response Quality" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Completions vs Dropouts</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              dataKey="completions"
              nameKey="surveyTitle"
              cx="50%"
              cy="50%"
              outerRadius={60}
              fill="#6366f1"
              label
            />
            <Pie
              data={data}
              dataKey="dropouts"
              nameKey="surveyTitle"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              fill="#f59e42"
              label
            />
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 