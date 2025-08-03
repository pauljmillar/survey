import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PanelistAccount {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

export function UserManagement() {
  const [accounts, setAccounts] = useState<PanelistAccount[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/panelists')
      .then(res => res.json())
      .then(data => setAccounts(data))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, []);

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

  function handleBulkAction(action: 'deactivate' | 'delete') {
    setLoading(true);
    setSuccess('');
    setError('');
    fetch('/api/admin/panelists/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        panelistIds: Array.from(selected),
        action,
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update accounts');
        setSuccess('Bulk action completed!');
        setAccounts(accounts =>
          accounts.map(a =>
            selected.has(a.id)
              ? action === 'delete'
                ? null
                : { ...a, status: action === 'deactivate' ? 'inactive' : a.status }
              : a
          ).filter(Boolean) as PanelistAccount[]
        );
        setSelected(new Set());
      })
      .catch(() => setError('Could not update accounts.'))
      .finally(() => setLoading(false));
  }

  function handleStatusChange(id: string, status: 'active' | 'inactive') {
    setLoading(true);
    setSuccess('');
    setError('');
    fetch(`/api/admin/panelists/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update status');
        setSuccess('Status updated!');
        setAccounts(accounts =>
          accounts.map(a => (a.id === id ? { ...a, status } : a))
        );
      })
      .catch(() => setError('Could not update status.'))
      .finally(() => setLoading(false));
  }

  function handleDelete(id: string) {
    setLoading(true);
    setSuccess('');
    setError('');
    fetch(`/api/admin/panelists/${id}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete account');
        setSuccess('Account deleted!');
        setAccounts(accounts => accounts.filter(a => a.id !== id));
      })
      .catch(() => setError('Could not delete account.'))
      .finally(() => setLoading(false));
  }

  const filtered = accounts.filter(
    a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white dark:bg-black rounded shadow">
      <h2 className="text-xl font-bold mb-4">Panelist Account Management</h2>
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
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="border-b">
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(a.id)}
                    onChange={() => toggleSelect(a.id)}
                  />
                </td>
                <td>{a.name}</td>
                <td>{a.email}</td>
                <td>{a.status}</td>
                <td className="flex gap-2">
                  <Button
                    size="sm"
                    variant={a.status === 'active' ? 'outline' : 'default'}
                    onClick={() => handleStatusChange(a.id, a.status === 'active' ? 'inactive' : 'active')}
                    disabled={loading}
                  >
                    {a.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(a.id)}
                    disabled={loading}
                  >
                    Delete
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
          onClick={() => handleBulkAction('deactivate')}
          disabled={selected.size === 0 || loading}
        >
          Deactivate Selected
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => handleBulkAction('delete')}
          disabled={selected.size === 0 || loading}
        >
          Delete Selected
        </Button>
      </div>
      {success && <div className="text-green-600 mt-2">{success}</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
} 