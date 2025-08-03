import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SurveyAdminAccount {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  permissions: string[];
}

export function SurveyAdminManagement() {
  const [admins, setAdmins] = useState<SurveyAdminAccount[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', permissions: '' });

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/survey-admins')
      .then(res => res.json())
      .then(data => setAdmins(data))
      .catch(() => setAdmins([]))
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

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await fetch('/api/admin/survey-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAdmin.name,
          email: newAdmin.email,
          permissions: newAdmin.permissions.split(',').map(p => p.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error('Failed to create admin');
      const created = await res.json();
      setAdmins(a => [...a, created]);
      setNewAdmin({ name: '', email: '', permissions: '' });
      setSuccess('Survey admin created!');
    } catch {
      setError('Could not create admin.');
    } finally {
      setLoading(false);
    }
  }

  function handleStatusChange(id: string, status: 'active' | 'inactive') {
    setLoading(true);
    setSuccess('');
    setError('');
    fetch(`/api/admin/survey-admins/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update status');
        setSuccess('Status updated!');
        setAdmins(admins =>
          admins.map(a => (a.id === id ? { ...a, status } : a))
        );
      })
      .catch(() => setError('Could not update status.'))
      .finally(() => setLoading(false));
  }

  function handleDelete(id: string) {
    setLoading(true);
    setSuccess('');
    setError('');
    fetch(`/api/admin/survey-admins/${id}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete admin');
        setSuccess('Admin deleted!');
        setAdmins(admins => admins.filter(a => a.id !== id));
      })
      .catch(() => setError('Could not delete admin.'))
      .finally(() => setLoading(false));
  }

  function handlePermissionChange(id: string, permissions: string) {
    setLoading(true);
    setSuccess('');
    setError('');
    fetch(`/api/admin/survey-admins/${id}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: permissions.split(',').map(p => p.trim()).filter(Boolean) }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update permissions');
        setSuccess('Permissions updated!');
        setAdmins(admins =>
          admins.map(a => (a.id === id ? { ...a, permissions: permissions.split(',').map(p => p.trim()).filter(Boolean) } : a))
        );
      })
      .catch(() => setError('Could not update permissions.'))
      .finally(() => setLoading(false));
  }

  const filtered = admins.filter(
    a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white dark:bg-black rounded shadow">
      <h2 className="text-xl font-bold mb-4">Survey Admin Account Management</h2>
      <form onSubmit={handleCreateAdmin} className="mb-6 flex flex-col gap-2 bg-gray-50 dark:bg-zinc-900 p-4 rounded">
        <div className="flex gap-2">
          <Input
            placeholder="Name"
            value={newAdmin.name}
            onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
            required
          />
          <Input
            placeholder="Email"
            value={newAdmin.email}
            onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
            required
          />
        </div>
        <Input
          placeholder="Permissions (comma-separated)"
          value={newAdmin.permissions}
          onChange={e => setNewAdmin({ ...newAdmin, permissions: e.target.value })}
        />
        <Button type="submit" disabled={loading} className="w-full mt-2">
          {loading ? 'Creating...' : 'Create Survey Admin'}
        </Button>
      </form>
      <Input
        placeholder="Search survey admins by name or email"
        value={search}
        onChange={handleSearch}
        className="mb-4"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="border-b">
                <td>{a.name}</td>
                <td>{a.email}</td>
                <td>{a.status}</td>
                <td>
                  <Input
                    value={a.permissions.join(', ')}
                    onChange={e => handlePermissionChange(a.id, e.target.value)}
                    className="w-48"
                  />
                </td>
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
      {success && <div className="text-green-600 mt-2">{success}</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
} 