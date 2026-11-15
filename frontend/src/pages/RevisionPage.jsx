
import { useCallback, useEffect, useState } from 'react';
import {
  getRevisionSchedule,
  getRevisionHistory,
  completeRevision,
  scheduleRevision,
} from '../services/learning';

function RevisionSection({ title, items, onComplete, completingId }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500">
          No revisions in this section.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900">
                  {item.question?.title || 'Question'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {item.question?.topic || 'Other'} · {item.question?.pattern || 'General'}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Due: {new Date(item.dueAt).toLocaleDateString()}
                  {' · '}
                  {item.question?.difficulty || 'Unknown difficulty'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {item.question?.url && (
                  <a
                    href={item.question.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Open Question
                  </a>
                )}

                <button
                  onClick={() => onComplete(item.id)}
                  disabled={completingId === item.id}
                  className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {completingId === item.id ? 'Saving...' : 'Complete'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function RevisionPage() {
  const [schedule, setSchedule] = useState({
    summary: {},
    overdue: [],
    dueToday: [],
    upcoming: [],
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [completingId, setCompletingId] = useState(null);
  const [questionId, setQuestionId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [scheduleData, historyData] = await Promise.all([
        getRevisionSchedule(),
        getRevisionHistory(),
      ]);

      setSchedule({
        summary: scheduleData.summary || {},
        overdue: scheduleData.overdue || [],
        dueToday: scheduleData.dueToday || [],
        upcoming: scheduleData.upcoming || [],
      });

      setHistory(historyData.history || []);
    } catch (err) {
      setError(
        err.response?.data?.error || 'Unable to load revision schedule.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleComplete = async (id) => {
    try {
      setCompletingId(id);
      setError('');
      setMessage('');

      await completeRevision(id);
      await loadData();

      setMessage('Revision marked as completed.');
    } catch (err) {
      setError(
        err.response?.data?.error || 'Unable to complete revision.'
      );
    } finally {
      setCompletingId(null);
    }
  };

  const handleSchedule = async (event) => {
    event.preventDefault();

    if (!questionId.trim() || !dueAt) {
      setError('Enter a question ID and revision date.');
      return;
    }

    try {
      setScheduling(true);
      setError('');
      setMessage('');

      await scheduleRevision(questionId.trim(), dueAt);

      setQuestionId('');
      setDueAt('');
      await loadData();

      setMessage('Revision scheduled successfully.');
    } catch (err) {
      setError(
        err.response?.data?.error || 'Unable to schedule revision.'
      );
    } finally {
      setScheduling(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-gray-500">Loading revision schedule...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Smart Revision</h1>
        <p className="mt-1 text-sm text-gray-500">
          Revisit questions regularly and strengthen your problem-solving skills.
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
        {[
          { label: 'Overdue', value: schedule.summary.overdue || 0, color: 'text-red-600' },
          { label: 'Due Today', value: schedule.summary.dueToday || 0, color: 'text-orange-600' },
          { label: 'Upcoming', value: schedule.summary.upcoming || 0, color: 'text-indigo-600' },
          { label: 'Total Pending', value: schedule.summary.totalPending || 0, color: 'text-gray-900' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className={`mt-1 text-2xl font-bold ${item.color}`}>
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <RevisionSection
        title="Overdue Revisions"
        items={schedule.overdue}
        onComplete={handleComplete}
        completingId={completingId}
      />

      <RevisionSection
        title="Due Today"
        items={schedule.dueToday}
        onComplete={handleComplete}
        completingId={completingId}
      />

      <RevisionSection
        title="Upcoming Revisions"
        items={schedule.upcoming}
        onComplete={handleComplete}
        completingId={completingId}
      />

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Schedule a Revision
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter a question's database ID and the date you want to revise it.
        </p>

        <form onSubmit={handleSchedule} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            value={questionId}
            onChange={(event) => setQuestionId(event.target.value)}
            placeholder="Question database ID"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />

          <input
            type="date"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={scheduling}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {scheduling ? 'Scheduling...' : 'Schedule Revision'}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Revision History
        </h2>

        {history.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
            No completed revisions yet.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {item.question?.title || 'Question'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.question?.topic || 'Other'}
                  </p>
                </div>
                <span className="text-xs text-green-700">
                  Completed {item.completedAt
                    ? new Date(item.completedAt).toLocaleDateString()
                    : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
