import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet } from 'react-router-dom';
import { getSubscriptionStatus } from '../lib/api';

export default function SubscriptionGuard() {
  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: getSubscriptionStatus,
    retry: 1,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Checking subscription...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        Unable to verify your subscription. Please refresh the page.
      </div>
    );
  }

  if (!data?.subscription?.active) {
    return <Navigate to="/subscription" replace />;
  }

  return <Outlet />;
}