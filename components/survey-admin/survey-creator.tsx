import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const DRAFT_KEY = 'survey-creator-draft';

export function SurveyCreator() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    points_reward: '',
    estimated_completion_time: '',
    qualification_criteria: '',
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
    if (!form.title || !form.description || !form.points_reward || !form.estimated_completion_time) {
      setError('All fields except qualification criteria are required.');
      setLoading(false);
      return;
    }

    try {
      const surveyData = {
        title: form.title,
        description: form.description,
        points_reward: Number(form.points_reward),
        estimated_completion_time: Number(form.estimated_completion_time),
        qualification_criteria: form.qualification_criteria ? 
          JSON.parse(form.qualification_criteria) : {},
        status: 'active'
      };

      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create survey');
      }

      setSuccess('Survey created successfully!');
      localStorage.removeItem(DRAFT_KEY);
      setForm({ 
        title: '', 
        description: '', 
        points_reward: '', 
        estimated_completion_time: '', 
        qualification_criteria: '' 
      });
    } catch (err) {
      console.error('Error creating survey:', err);
      setError(err instanceof Error ? err.message : 'Could not create survey.');
    } finally {
      setLoading(false);
    }
  }

  function handleSaveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    setSuccess('Draft saved!');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Survey Title *
          </label>
          <Input 
            name="title" 
            value={form.title} 
            onChange={handleChange} 
            required 
            placeholder="Enter survey title"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Points Reward *
          </label>
          <Input 
            name="points_reward" 
            value={form.points_reward} 
            onChange={handleChange} 
            type="number" 
            min="1" 
            required 
            placeholder="50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Description *
        </label>
        <textarea 
          name="description" 
          value={form.description} 
          onChange={handleChange} 
          required 
          className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 min-h-[100px]" 
          placeholder="Describe what this survey is about..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Estimated Time (minutes) *
          </label>
          <Input 
            name="estimated_completion_time" 
            value={form.estimated_completion_time} 
            onChange={handleChange} 
            type="number" 
            min="1" 
            required 
            placeholder="5"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Qualification Criteria (JSON)
          </label>
          <Input 
            name="qualification_criteria" 
            value={form.qualification_criteria} 
            onChange={handleChange} 
            placeholder='{"age_group": "18-65"}'
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Creating...' : 'Create Survey'}
        </Button>
        <Button type="button" variant="outline" onClick={handleSaveDraft} className="flex-1">
          Save Draft
        </Button>
      </div>
      
      {success && <div className="text-green-600 mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">{success}</div>}
      {error && <div className="text-red-600 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">{error}</div>}
    </form>
  );
} 