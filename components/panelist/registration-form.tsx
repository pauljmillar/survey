import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  location: string;
  interests: string[];
  agreeToTerms: boolean;
}

export function RegistrationForm() {
  const { user, isSignedIn } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    location: '',
    interests: [],
    agreeToTerms: false,
  });

  const interests = [
    'Technology', 'Health & Wellness', 'Travel', 'Food & Dining',
    'Shopping', 'Entertainment', 'Sports', 'Education', 'Finance'
  ];

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleInterestToggle(interest: string) {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  }

  function validateStep(stepNumber: number): boolean {
    switch (stepNumber) {
      case 1:
        return formData.firstName.trim() !== '' && formData.lastName.trim() !== '' && formData.email.trim() !== '';
      case 2:
        return formData.phone.trim() !== '' && formData.dateOfBirth.trim() !== '' && formData.gender.trim() !== '';
      case 3:
        return formData.location.trim() !== '' && formData.interests.length > 0;
      case 4:
        return formData.agreeToTerms;
      default:
        return true;
    }
  }

  async function handleSubmit() {
    if (!validateStep(step)) {
      setError('Please fill in all required fields.');
      return;
    }

    if (step < 4) {
      setStep(step + 1);
      setError('');
      return;
    }

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const res = await fetch('/api/panelist/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Registration failed');

      setSuccess('Registration successful! Welcome to the panel.');
      // Redirect to dashboard or onboarding
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (isSignedIn) {
    return (
      <div className="max-w-md mx-auto p-4 bg-white dark:bg-black rounded shadow">
        <h2 className="text-xl font-bold mb-4">Welcome Back!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You are already signed in. Your profile is ready.
        </p>
        <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-white dark:bg-black rounded shadow">
      <h2 className="text-xl font-bold mb-4">Panelist Registration</h2>
      
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4].map(stepNumber => (
            <div
              key={stepNumber}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                stepNumber <= step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600'
              }`}
            >
              {stepNumber}
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Step {step} of 4
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Basic Information</h3>
          <Input
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />
          <Input
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleInputChange}
            required
          />
          <Input
            name="email"
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Contact Information</h3>
          <Input
            name="phone"
            type="tel"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleInputChange}
            required
          />
          <Input
            name="dateOfBirth"
            type="date"
            placeholder="Date of Birth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-2">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="w-full p-2 border rounded dark:bg-black dark:border-gray-700"
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Preferences</h3>
          <Input
            name="location"
            placeholder="City, State"
            value={formData.location}
            onChange={handleInputChange}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-2">Interests (select all that apply)</label>
            <div className="grid grid-cols-2 gap-2">
              {interests.map(interest => (
                <label key={interest} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.interests.includes(interest)}
                    onChange={() => handleInterestToggle(interest)}
                    className="rounded"
                  />
                  <span className="text-sm">{interest}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Terms and Conditions</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <p>By registering, you agree to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Complete surveys honestly and accurately</li>
              <li>Maintain the confidentiality of survey content</li>
              <li>Receive communications about new surveys and offers</li>
              <li>Allow us to use your data for research purposes</li>
            </ul>
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              className="rounded"
              required
            />
            <span className="text-sm">I agree to the terms and conditions</span>
          </label>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        {step > 1 && (
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={loading}
            className="flex-1"
          >
            Previous
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={loading || !validateStep(step)}
          className="flex-1"
        >
          {loading ? 'Processing...' : step === 4 ? 'Complete Registration' : 'Next'}
        </Button>
      </div>

      {success && <div className="text-green-600 mt-4">{success}</div>}
      {error && <div className="text-red-600 mt-4">{error}</div>}
    </div>
  );
} 