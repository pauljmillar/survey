import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Offer {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  merchantName: string;
  status: 'active' | 'inactive';
}

interface Redemption {
  id: string;
  offerId: string;
  offerTitle: string;
  pointsSpent: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export function RedemptionSystem() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/panelist/offers').then(res => res.json()),
      fetch('/api/panelist/redemptions').then(res => res.json()),
      fetch('/api/panelist/points').then(res => res.json()).then(data => data.balance || 0)
    ])
      .then(([offersData, redemptionsData, balance]) => {
        setOffers(offersData);
        setRedemptions(redemptionsData);
        setPointsBalance(balance);
      })
      .catch(() => {
        setOffers([]);
        setRedemptions([]);
        setPointsBalance(0);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleRedeem(offerId: string, pointsRequired: number) {
    setLoading(true);
    setSuccess('');
    setError('');
    if (pointsBalance < pointsRequired) {
      setError('Insufficient points balance.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/panelist/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      });
      if (!res.ok) throw new Error('Failed to redeem offer');
      const redemption = await res.json();
      setRedemptions(prev => [redemption, ...prev]);
      setPointsBalance(prev => prev - pointsRequired);
      setSuccess('Redemption successful!');
      setConfirming(null);
    } catch {
      setError('Could not redeem offer.');
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  const availableOffers = offers.filter(o => o.status === 'active');

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white dark:bg-black rounded shadow">
      <h2 className="text-xl font-bold mb-4">Points Redemption</h2>
      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 rounded">
        <p className="text-lg font-semibold">Your Points Balance: {pointsBalance}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Available Offers</h3>
          {loading ? (
            <p>Loading offers...</p>
          ) : availableOffers.length === 0 ? (
            <p className="text-gray-500">No offers available for redemption.</p>
          ) : (
            <div className="space-y-4">
              {availableOffers.map(offer => (
                <div key={offer.id} className="border rounded p-4">
                  <h4 className="font-semibold">{offer.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{offer.description}</p>
                  <p className="text-sm mb-2">Merchant: {offer.merchantName}</p>
                  <p className="text-sm font-semibold mb-2">Points Required: {offer.pointsRequired}</p>
                  {pointsBalance >= offer.pointsRequired ? (
                    <Button
                      onClick={() => setConfirming(offer.id)}
                      disabled={loading}
                      className="w-full"
                    >
                      Redeem Offer
                    </Button>
                  ) : (
                    <p className="text-red-600 text-sm">Insufficient points</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Redemption History</h3>
          {loading ? (
            <p>Loading history...</p>
          ) : redemptions.length === 0 ? (
            <p className="text-gray-500">No redemption history.</p>
          ) : (
            <div className="space-y-3">
              {redemptions.map(redemption => (
                <div key={redemption.id} className="border rounded p-3">
                  <h4 className="font-semibold">{redemption.offerTitle}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Points Spent: {redemption.pointsSpent}
                  </p>
                  <p className="text-sm mb-1">
                    Date: {new Date(redemption.createdAt).toLocaleDateString()}
                  </p>
                  <p className={`text-sm font-semibold ${getStatusColor(redemption.status)}`}>
                    Status: {redemption.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {confirming && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-black rounded p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Redemption</h3>
            <p className="mb-4">Are you sure you want to redeem this offer?</p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const offer = availableOffers.find(o => o.id === confirming);
                  if (offer) handleRedeem(offer.id, offer.pointsRequired);
                }}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirming(null)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      {success && <div className="text-green-600 mt-4">{success}</div>}
      {error && <div className="text-red-600 mt-4">{error}</div>}
    </div>
  );
} 