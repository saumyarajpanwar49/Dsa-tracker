import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { getSubscriptionStatus } from '../lib/api';

export default function TrialCountdown() {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: getSubscriptionStatus,
  });

  const subscription = data?.subscription;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (subscription?.type !== 'TRIAL' || !subscription.trialEndsAt) {
    return null;
  }

  const remainingSeconds = Math.max(
    0,
    Math.ceil((new Date(subscription.trialEndsAt).getTime() - now) / 1000)
  );

  if (remainingSeconds <= 0) {
    navigate('/subscription', { replace: true });
    return null;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-yellow-500/15 p-3 text-yellow-400">
          <Clock size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text">
            Free Trial Remaining
          </p>
          <p className="text-xs text-muted">
            Subscribe for ₹15 to unlock six months of access.
          </p>
        </div>

        <div className="text-2xl font-bold tabular-nums text-yellow-400">
          {String(minutes).padStart(2, '0')}:
          {String(seconds).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}