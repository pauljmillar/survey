import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const DRAFT_KEY = 'survey-creator-draft';

export function SurveyCreator() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    points: '',
    estimatedTime: '',
    qualification: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      setForm(JSON.parse(draft));
    }
  }, []);

  // Save draft to localStorage
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    // Basic validation
    if (!form.title || !form.description || !form.points || !form.estimatedTime) {
      setError('All fields except qualification are required.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          points: Number(form.points),
          estimatedTime: form.estimatedTime,
          qualification: form.qualification,
        }),
      });
      if (!res.ok) throw new Error('Failed to create survey');
      setSuccess('Survey created successfully!');
      localStorage.removeItem(DRAFT_KEY);
      setForm({ title: '', description: '', points: '', estimatedTime: '', qualification: '' });
    } catch (err) {
      setError('Could not create survey.');
    } finally {
      setLoading(false);
    }
  }

  function handleSaveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    setSuccess('Draft saved!');
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 space-y-4 bg-white dark:bg-black rounded shadow">
      <h2 className="text-xl font-bold mb-2">Create New Survey</h2>
      <label className="block">
        Title
        <Input name="title" value={form.title} onChange={handleChange} required className="mt-1" />
      </label>
      <label className="block">
        Description
        <textarea name="description" value={form.description} onChange={handleChange} required className="mt-1 w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2" rows={4} />
      </label>
      <label className="block">
        Points Reward
        <Input name="points" value={form.points} onChange={handleChange} type="number" min="1" required className="mt-1" />
      </label>
      <label className="block">
        Estimated Completion Time (minutes)
        <Input name="estimatedTime" value={form.estimatedTime} onChange={handleChange} type="number" min="1" required className="mt-1" />
      </label>
      <label className="block">
        Qualification Criteria (optional)
        <Input name="qualification" value={form.qualification} onChange={handleChange} className="mt-1" />
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="w-full mt-2">
          {loading ? 'Creating...' : 'Create Survey'}
        </Button>
        <Button type="button" variant="outline" onClick={handleSaveDraft} className="w-full mt-2">
          Save Draft
        </Button>
      </div>
      {success && <div className="text-green-600 mt-2">{success}</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </form>
  );
} 