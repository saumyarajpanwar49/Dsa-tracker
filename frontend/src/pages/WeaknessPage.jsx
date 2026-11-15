
import { useCallback, useEffect, useState } from 'react';
import { getWeaknessAnalysis } from '../services/learning';

const LEVEL_STYLES = {
  Critical: 'bg-red-100 text-red-700',
  'Needs Practice': 'bg-orange-100 text-orange-700',
  Improving: 'bg-blue-100 text-blue-700',
  'Not Started': 'bg-gray-100 text-gray-600',
  Strong: 'bg-green-100 text-green-700',
};

function AnalysisCard({ item }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-900">{item.name}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${LEVEL_STYLES[item.level] || LEVEL_STYLES.Strong}`}>
          {item.level}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xl font-bold text-gray-900">{item.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">{item.attempted}</p>
          <p className="text-xs text-gray-500">Attempted</p>
        </div>
        <div>
          <p className="text-xl font-bold text-green-600">{item.solved}</p>
          <p className="text-xs text-gray-500">Solved</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-gray-500">Completion</span>
            <span className="font-semibold text-gray-700">{item.completionRate}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${Math.min(item.completionRate, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-gray-500">Success rate</span>
            <span className="font-semibold text-gray-700">{item.successRate}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${Math.min(item.successRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {item.unattempted} questions not attempted yet
      </p>
    </article>
  );
}

export default function WeaknessPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('topics');

  const loadAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const result = await getWeaknessAnalysis();
      setData(result);
    } catch (err) {
      setError(
        err.response?.data?.error || 'Unable to load weakness analysis.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

  if (loading) {
    return <p className="p-6 text-gray-500">Analyzing your progress...</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        <p>{error}</p>
        <button
          onClick={loadAnalysis}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const items = activeTab === 'topics' ? data.topics : data.patterns;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Weakness Analysis</h1>
        <p className="mt-1 text-sm text-gray-500">
          Identify topics and patterns that need more practice.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Total Topics</p>
          <p className="mt-1 text-2xl font-bold">{data.summary.totalTopics}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Weak Topics</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{data.summary.weakTopics}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Total Patterns</p>
          <p className="mt-1 text-2xl font-bold">{data.summary.totalPatterns}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Weak Patterns</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">{data.summary.weakPatterns}</p>
        </div>
      </section>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('topics')}
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${
            activeTab === 'topics'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500'
          }`}
        >
          Topic Analysis
        </button>
        <button
          onClick={() => setActiveTab('patterns')}
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${
            activeTab === 'patterns'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500'
          }`}
        >
          Pattern Analysis
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border bg-white p-6 text-gray-500">
          No analysis data available.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <AnalysisCard key={item.name} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
