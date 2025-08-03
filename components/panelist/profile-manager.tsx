import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ProfileManager() {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    preferences: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoaded && user) {
      setForm({
        name: user.fullName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        preferences: '',
      });
      // Fetch additional profile data from backend
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => setProfile(data))
        .catch(() => setProfile(null));
    }
  }, [isLoaded, user]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Could not update profile.');
    } finally {
      setLoading(false);
    }
  }

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4 bg-white dark:bg-black rounded shadow">
      <h2 className="text-xl font-bold mb-2">Profile Information</h2>
      <label className="block">
        Name
        <Input name="name" value={form.name} onChange={handleChange} required className="mt-1" />
      </label>
      <label className="block">
        Email
        <Input name="email" value={form.email} onChange={handleChange} type="email" required className="mt-1" />
      </label>
      <label className="block">
        Preferences
        <Input name="preferences" value={form.preferences} onChange={handleChange} className="mt-1" />
      </label>
      <Button type="submit" disabled={loading} className="w-full mt-2">
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
      {success && <div className="text-green-600 mt-2">{success}</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </form>
  );
} 