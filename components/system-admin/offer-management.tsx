import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Offer {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  merchantName: string;
  status: 'active' | 'inactive';
}

export function OfferManagement() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [newOffer, setNewOffer] = useState({
    title: '',
    description: '',
    pointsRequired: '',
    merchantName: '',
  });

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/offers')
      .then(res => res.json())
      .then(data => setOffers(data))
      .catch(() => setOffers([]))
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

  async function handleCreateOffer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    if (!newOffer.title || !newOffer.description || !newOffer.pointsRequired || !newOffer.merchantName) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newOffer,
          pointsRequired: Number(newOffer.pointsRequired),
        }),
      });
      if (!res.ok) throw new Error('Failed to create offer');
      const created = await res.json();
      setOffers(o => [...o, created]);
      setNewOffer({ title: '', description: '', pointsRequired: '', merchantName: '' });
      setSuccess('Offer created!');
    } catch {
      setError('Could not create offer.');
    } finally {
      setLoading(false);
    }
  }

  function handleStatusChange(id: string, status: 'active' | 'inactive') {
    setLoading(true);
    setSuccess('');
    setError('');
    fetch(`/api/admin/offers/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update status');
        setSuccess('Status updated!');
        setOffers(offers =>
          offers.map(o => (o.id === id ? { ...o, status } : o))
        );
      })
      .catch(() => setError('Could not update status.'))
      .finally(() => setLoading(false));
  }

  function handleDelete(id: string) {
    setLoading(true);
    setSuccess('');
    setError('');
    fetch(`/api/admin/offers/${id}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete offer');
        setSuccess('Offer deleted!');
        setOffers(offers => offers.filter(o => o.id !== id));
      })
      .catch(() => setError('Could not delete offer.'))
      .finally(() => setLoading(false));
  }

  function handleBulkStatus(status: 'active' | 'inactive') {
    setLoading(true);
    setSuccess('');
    setError('');
    fetch('/api/admin/offers/bulk-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerIds: Array.from(selected), status }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update offers');
        setSuccess('Bulk status updated!');
        setOffers(offers =>
          offers.map(o =>
            selected.has(o.id) ? { ...o, status } : o
          )
        );
        setSelected(new Set());
      })
      .catch(() => setError('Could not update offers.'))
      .finally(() => setLoading(false));
  }

  function handleBulkDelete() {
    setLoading(true);
    setSuccess('');
    setError('');
    fetch('/api/admin/offers/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerIds: Array.from(selected) }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete offers');
        setSuccess('Bulk delete completed!');
        setOffers(offers => offers.filter(o => !selected.has(o.id)));
        setSelected(new Set());
      })
      .catch(() => setError('Could not delete offers.'))
      .finally(() => setLoading(false));
  }

  const filtered = offers.filter(
    o =>
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.merchantName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white dark:bg-black rounded shadow">
      <h2 className="text-xl font-bold mb-4">Merchant Offer Management</h2>
      <form onSubmit={handleCreateOffer} className="mb-6 flex flex-col gap-2 bg-gray-50 dark:bg-zinc-900 p-4 rounded">
        <div className="flex gap-2">
          <Input
            placeholder="Title"
            value={newOffer.title}
            onChange={e => setNewOffer({ ...newOffer, title: e.target.value })}
            required
          />
          <Input
            placeholder="Merchant Name"
            value={newOffer.merchantName}
            onChange={e => setNewOffer({ ...newOffer, merchantName: e.target.value })}
            required
          />
        </div>
        <Input
          placeholder="Points Required"
          type="number"
          min="1"
          value={newOffer.pointsRequired}
          onChange={e => setNewOffer({ ...newOffer, pointsRequired: e.target.value })}
          required
        />
        <Input
          placeholder="Description"
          value={newOffer.description}
          onChange={e => setNewOffer({ ...newOffer, description: e.target.value })}
          required
        />
        <Button type="submit" disabled={loading} className="w-full mt-2">
          {loading ? 'Creating...' : 'Create Offer'}
        </Button>
      </form>
      <Input
        placeholder="Search offers by title or merchant"
        value={search}
        onChange={handleSearch}
        className="mb-4"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th></th>
              <th>Title</th>
              <th>Merchant</th>
              <th>Points</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-b">
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(o.id)}
                    onChange={() => toggleSelect(o.id)}
                  />
                </td>
                <td>{o.title}</td>
                <td>{o.merchantName}</td>
                <td>{o.pointsRequired}</td>
                <td>{o.status}</td>
                <td className="flex gap-2">
                  <Button
                    size="sm"
                    variant={o.status === 'active' ? 'outline' : 'default'}
                    onClick={() => handleStatusChange(o.id, o.status === 'active' ? 'inactive' : 'active')}
                    disabled={loading}
                  >
                    {o.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(o.id)}
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
          onClick={() => handleBulkStatus('active')}
          disabled={selected.size === 0 || loading}
        >
          Activate Selected
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleBulkStatus('inactive')}
          disabled={selected.size === 0 || loading}
        >
          Deactivate Selected
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleBulkDelete}
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