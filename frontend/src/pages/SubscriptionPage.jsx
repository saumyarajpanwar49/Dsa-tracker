import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createSubscriptionOrder,
  getSubscriptionStatus,
  verifySubscriptionPayment,
} from '../lib/api';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    getSubscriptionStatus()
      .then((result) => {
        if (active) setSubscription(result);
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.error ||
            'Unable to load subscription details.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handlePayment = async () => {
    if (paying) return;

    setError('');
    setMessage('');
    setPaying(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error(
          'Unable to load Razorpay. Check your internet connection.'
        );
      }

      const order = await createSubscriptionOrder();

      if (!order?.orderId || !order?.keyId || !order?.amount) {
        throw new Error('Invalid payment order received from server.');
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'KONOHA DSA',
        description: 'Six-month DSA Tracker subscription',
        order_id: order.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#FFD700',
        },
        handler: async (response) => {
          setMessage('Verifying your payment securely...');

          try {
            await verifySubscriptionPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            await refreshUser();

            setMessage(
              'Payment successful! Your six-month access is active.'
            );

            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1200);
          } catch (err) {
            setError(
              err.response?.data?.error ||
              'Payment verification failed. Access has not been activated. Please contact support.'
            );
            setMessage('');
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setMessage('');
          },
          escape: true,
          confirm_close: true,
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on('payment.failed', (response) => {
        setError(
          response.error?.description ||
          response.error?.reason ||
          'Payment failed. No subscription was activated. Please try again.'
        );
        setMessage('');
        setPaying(false);
      });

      checkout.open();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'Could not start payment.'
      );
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
        Loading subscription...
      </div>
    );
  }

  const current = subscription?.subscription;

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <p className="text-sm font-mono tracking-widest text-[#FFD700]">
            KONOHA DSA
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Subscription
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Continue your DSA preparation without interruption.
          </p>
        </div>

        <div className="rounded-2xl border border-[#444] bg-[#151515] p-6 space-y-5">
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Six-month access
            </p>

            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-5xl font-bold text-[#FFD700]">
                ₹15
              </span>
              <span className="text-sm text-gray-400">
                / 6 months
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              One-time payment. No automatic renewals.
            </p>
          </div>

          <div className="border-t border-[#333] pt-5 space-y-3">
            <div className="flex justify-between text-sm gap-3">
              <span className="text-gray-400">Account</span>
              <span className="break-all text-right">
                {user?.email}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Current status</span>
              <span className="text-[#FFD700]">
                {current?.type || 'Unknown'}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Access duration</span>
              <span>6 months</span>
            </div>
          </div>

          <div className="border-t border-[#333] pt-5 space-y-2">
            <p className="text-sm font-semibold">
              Available payment methods
            </p>
            <p className="text-sm text-gray-400">
              UPI, debit cards and credit cards through Razorpay Checkout.
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={handlePayment}
            disabled={paying}
            className="w-full rounded-xl bg-[#FFD700] px-5 py-3 font-bold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {paying ? 'Processing...' : 'Pay ₹15 and Unlock 6 Months'}
          </button>

          <p className="text-center text-xs text-gray-500">
            Payments are verified securely by our server.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="w-full text-center text-sm text-gray-400 hover:text-white"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}