import { useCallback, useEffect, useState } from 'react';
import { getAnalytics, updateDailyGoal } from '../services/learning';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [goal, setGoal] = useState('5');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const result = await getAnalytics();
      setData(result);

      if (result.today?.goal != null && result.today.goal > 0) {
        setGoal(String(result.today.goal));
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'Unable to load analytics.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleGoalUpdate = async (event) => {
    event.preventDefault();

    const target = Number(goal);

    if (!Number.isInteger(target) || target < 1 || target > 500) {
      setError('Daily goal must be between 1 and 500.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');

      await updateDailyGoal(target);
      await loadAnalytics();

      setMessage('Daily goal updated successfully.');
    } catch (err) {
      setError(
        err.response?.data?.error || 'Unable to update daily goal.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-gray-500">Loading analytics...</p>;
  }

  if (!data) {
    return (
      <div className="p-6 text-red-600">
        {error || 'Analytics data is unavailable.'}
      </div>
    );
  }

  const stats = data.overview || {};
  const activity = data.dailyActivity || [];
  const today = data.today || {};

  const totalQuestions = Number(stats.totalQuestions || 0);
  const solvedQuestions = Number(stats.solved || 0);

  const completionRate = totalQuestions > 0
    ? ((solvedQuestions / totalQuestions) * 100).toFixed(2)
    : '0.00';

  const maxSolved = Math.max(
    1,
    ...activity.map((day) => Number(day.solved || 0))
  );

  const cards = [
    { label: 'Total Questions', value: totalQuestions },
    { label: 'Solved', value: solvedQuestions },
    { label: 'Attempted', value: stats.attempted ?? 0 },
    { label: 'Not Started', value: stats.unattempted ?? 0 },
    { label: 'Completion', value: `${completionRate}%` },
    { label: 'Success Rate', value: `${stats.successRate ?? 0}%` },
    { label: 'Current Streak', value: `${data.streaks?.current ?? 0} days` },
    { label: 'Longest Streak', value: `${data.streaks?.longest ?? 0} days` },
  ];

  const todaySolved = Number(today.solved || 0);
  const dailyTarget = Number(today.goal || 0);

  const goalProgress = dailyTarget > 0
    ? Math.min(100, Math.round((todaySolved / dailyTarget) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Progress Analytics
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your DSA preparation, daily activity and consistency.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Daily Goal
        </h2>

        <form
          onSubmit={handleGoalUpdate}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <div>
            <label className="mb-1 block text-sm text-gray-600">
              Questions per day
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              className="w-40 rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Update Goal'}
          </button>
        </form>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-gray-600">Today's progress</span>
            <span className="font-semibold text-gray-900">
              {todaySolved} / {dailyTarget || 'Not set'}
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Daily Solved Questions
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Your activity over the last 30 days.
        </p>

        {activity.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500">
            No daily activity available yet.
          </p>
        ) : (
          <div className="mt-6 flex h-52 items-end gap-2 overflow-x-auto pb-2">
            {activity.map((day, index) => {
              const solved = Number(day.solved || 0);
              const height = Math.max(
                solved > 0 ? 8 : 2,
                (solved / maxSolved) * 100
              );

              return (
                <div
                  key={day.date || index}
                  className="flex h-full min-w-6 flex-1 flex-col items-center justify-end gap-2"
                  title={`${day.date}: ${solved} solved`}
                >
                  <span className="text-xs text-gray-500">
                    {solved || ''}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-indigo-500"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-gray-400">
                    {day.date
                      ? new Date(`${day.date}T00:00:00`).getDate()
                      : ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Preparation Summary
        </h2>

        <div className="mt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Solved questions</span>
            <span className="font-semibold">{solvedQuestions}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Remaining questions</span>
            <span className="font-semibold">
              {Math.max(0, totalQuestions - solvedQuestions)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">30-day activity</span>
            <span className="font-semibold">
              {activity.length} days tracked
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
