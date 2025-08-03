import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Panelist {
  id: string;
  name: string;
  email: string;
  qualified: boolean;
}

export function QualificationManager({ surveyId }: { surveyId: string }) {
  const [panelists, setPanelists] = useState<Panelist[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/surveys/${surveyId}/panelists`)
      .then(res => res.json())
      .then(data => setPanelists(data))
      .catch(() => setPanelists([]))
      .finally(() => setLoading(false));
  }, [surveyId]);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkQualify(qualify: boolean) {
    setLoading(true);
    setSuccess('');
    setError('');
    fetch(`/api/surveys/${surveyId}/qualifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        panelistIds: Array.from(selected),
        qualify,
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update qualifications');
        setSuccess('Qualifications updated!');
        // Update local state
        setPanelists(panelists =>
          panelists.map(p =>
            selected.has(p.id) ? { ...p, qualified: qualify } : p
          )
        );
        setSelected(new Set());
      })
      .catch(() => setError('Could not update qualifications.'))
      .finally(() => setLoading(false));
  }

  function handleToggleQualification(id: string, qualify: boolean) {
    setLoading(true);
    setSuccess('');
    setError('');
    fetch(`/api/surveys/${surveyId}/qualifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ panelistIds: [id], qualify }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update qualification');
        setSuccess('Qualification updated!');
        setPanelists(panelists =>
          panelists.map(p =>
            p.id === id ? { ...p, qualified: qualify } : p
          )
        );
      })
      .catch(() => setError('Could not update qualification.'))
      .finally(() => setLoading(false));
  }

  const filtered = panelists.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white dark:bg-black rounded shadow">
      <h2 className="text-xl font-bold mb-4">Survey Qualification Manager</h2>
      <Input
        placeholder="Search panelists by name or email"
        value={search}
        onChange={handleSearch}
        className="mb-4"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Email</th>
              <th>Qualified</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b">
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                  />
                </td>
                <td>{p.name}</td>
                <td>{p.email}</td>
                <td>{p.qualified ? 'Yes' : 'No'}</td>
                <td>
                  <Button
                    size="sm"
                    variant={p.qualified ? 'outline' : 'default'}
                    onClick={() => handleToggleQualification(p.id, !p.qualified)}
                    disabled={loading}
                  >
                    {p.qualified ? 'Unqualify' : 'Qualify'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 mt-4">
        <Button
          type="button"
          variant="default"
          onClick={() => handleBulkQualify(true)}
          disabled={selected.size === 0 || loading}
        >
          Qualify Selected
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleBulkQualify(false)}
          disabled={selected.size === 0 || loading}
        >
          Unqualify Selected
        </Button>
      </div>
      {success && <div className="text-green-600 mt-2">{success}</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
} 