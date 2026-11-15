import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getRoadmap,
  generateRoadmap,
  updateRoadmapStatus,
} from '../services/learning';

const STATUS_STYLES = {
  completed: 'bg-green-100 text-green-700 border-green-200',
  active: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  locked: 'bg-gray-100 text-gray-600 border-gray-200',
};

const MIN_SOLVED_QUESTIONS = 20;
const MIN_SUCCESS_RATE = 70;

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [analysis, setAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadRoadmap = useCallback(async () => {
    try {
      setError('');

      const data = await getRoadmap();

      setRoadmap(Array.isArray(data?.roadmap) ? data.roadmap : []);
      setRecommendations(
        Array.isArray(data?.recommendations) ? data.recommendations : []
      );
      setAnalysis(Array.isArray(data?.analysis) ? data.analysis : []);
    } catch (err) {
      console.error('Load roadmap error:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to load your roadmap.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoadmap();
  }, [loadRoadmap]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      setMessage('');

      const data = await generateRoadmap();

      setMessage(data?.message || 'Roadmap generated successfully.');
      await loadRoadmap();
    } catch (err) {
      console.error('Generate roadmap error:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to generate roadmap.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      setUpdatingId(id);
      setError('');
      setMessage('');

      const data = await updateRoadmapStatus(id, status);
      await loadRoadmap();

      setMessage(
        data?.message || 'Topic completed. Your next topic is now active!'
      );
    } catch (err) {
      console.error('Update roadmap error:', err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Unable to update roadmap.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const completedCount = roadmap.filter(
    (item) => item.status === 'completed'
  ).length;

  const activeItem = useMemo(
    () => roadmap.find((item) => item.status === 'active'),
    [roadmap]
  );

  const completionPercentage = roadmap.length
    ? Math.round((completedCount / roadmap.length) * 100)
    : 0;

  const getTopicProgress = (topicName) => {
    const item = analysis.find((entry) => entry.topic === topicName);

    if (!item) {
      return {
        total: 0,
        solved: 0,
        completionRate: 0,
        successRate: 0,
        requiredSolved: 0,
        eligibleForCompletion: false,
      };
    }

    const requiredSolved =
      item.requiredSolved ??
      Math.min(MIN_SOLVED_QUESTIONS, item.total);

    const successRate = Number(item.successRate) || 0;

    return {
      ...item,
      requiredSolved,
      successRate,
      eligibleForCompletion:
        item.eligibleForCompletion ??
        (
          item.total > 0 &&
          item.solved >= requiredSolved &&
          successRate >= MIN_SUCCESS_RATE
        ),
    };
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm text-gray-500">
          Loading your smart roadmap...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Smart Roadmap
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Your personalized DSA learning path, powered by your question progress.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generating
            ? 'Generating...'
            : roadmap.length
              ? 'Refresh Roadmap'
              : 'Generate Roadmap'}
        </button>
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

      {roadmap.length === 0 ? (
        <section className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Your roadmap is not generated yet
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Generate your learning path to see the topics you should study next.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {generating ? 'Generating...' : 'Create My Roadmap'}
          </button>
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">Total Topics</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {roadmap.length}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">Completed Topics</p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {completedCount}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">Remaining Topics</p>
              <p className="mt-2 text-3xl font-bold text-indigo-600">
                {roadmap.length - completedCount}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-gray-900">
                Overall Progress
              </h2>
              <span className="text-sm font-bold text-indigo-600">
                {completionPercentage}%
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <p className="mt-2 text-sm text-gray-500">
              {completedCount} of {roadmap.length} topics completed
            </p>
          </section>

          {activeItem && (() => {
            const progress = getTopicProgress(activeItem.topic);

            return (
              <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                  Current active topic
                </p>

                <h2 className="mt-2 text-xl font-bold text-gray-900">
                  {activeItem.topic}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  Focus pattern: {activeItem.pattern || 'General practice'}
                </p>

                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Questions solved</span>
                    <span className="font-semibold">
                      {progress.solved} / {progress.total}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, Number(progress.completionRate) || 0)
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-indigo-100 bg-white p-3">
                      <p className="text-xs text-gray-500">Questions required</p>
                      <p className="mt-1 font-bold text-gray-900">
                        {progress.solved} / {progress.requiredSolved}
                      </p>
                    </div>

                    <div className="rounded-lg border border-indigo-100 bg-white p-3">
                      <p className="text-xs text-gray-500">Success rate</p>
                      <p className="mt-1 font-bold text-gray-900">
                        {progress.successRate}%
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-indigo-800">
                    Requirements: solve at least {progress.requiredSolved} questions
                    and maintain a {MIN_SUCCESS_RATE}% success rate.
                  </p>

                  {progress.eligibleForCompletion ? (
                    <button
                      onClick={() =>
                        handleStatusChange(activeItem.id, 'completed')
                      }
                      disabled={updatingId === activeItem.id}
                      className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {updatingId === activeItem.id
                        ? 'Completing...'
                        : 'Complete Topic & Unlock Next'}
                    </button>
                  ) : (
                    <p className="mt-3 text-sm font-medium text-indigo-700">
                      {Math.max(
                        0,
                        progress.requiredSolved - progress.solved
                      ) > 0
                        ? `Solve ${progress.requiredSolved - progress.solved} more questions to meet the question requirement.`
                        : `Your success rate must reach ${MIN_SUCCESS_RATE}% to complete this topic.`}
                    </p>
                  )}
                </div>
              </section>
            );
          })()}

          {!activeItem && completedCount === roadmap.length && (
            <section className="rounded-xl border border-green-200 bg-green-50 p-5">
              <h2 className="text-lg font-bold text-green-800">
                Congratulations! Roadmap completed.
              </h2>
              <p className="mt-1 text-sm text-green-700">
                You have completed every topic in your current learning path.
              </p>
            </section>
          )}

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Your Learning Path
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Complete the question and success-rate requirements to unlock the next topic.
              </p>
            </div>

            {roadmap.map((item) => {
              const progress = getTopicProgress(item.topic);
              const isActive = item.status === 'active';
              const isCompleted = item.status === 'completed';

              return (
                <article
                  key={item.id}
                  className={`rounded-xl border bg-white p-5 shadow-sm ${
                    isActive
                      ? 'border-indigo-300 ring-1 ring-indigo-100'
                      : isCompleted
                        ? 'border-green-200'
                        : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isCompleted
                          ? 'bg-green-100 text-green-700'
                          : isActive
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isCompleted ? '✓' : item.position}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-gray-400">
                            STEP {item.position}
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              STATUS_STYLES[item.status] || STATUS_STYLES.locked
                            }`}
                          >
                            {(item.status || 'locked').toUpperCase()}
                          </span>
                        </div>

                        <h3 className="mt-2 font-semibold text-gray-900">
                          {item.topic}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Recommended focus: {item.pattern || 'General practice'}
                        </p>

                        <div className="mt-3">
                          <div className="flex flex-wrap justify-between gap-2 text-xs text-gray-500">
                            <span>
                              {progress.solved} of {progress.total} questions solved
                            </span>
                            <span>
                              {Number(progress.completionRate) || 0}%
                            </span>
                          </div>

                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isCompleted ? 'bg-green-500' : 'bg-indigo-500'
                              }`}
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(100, Number(progress.completionRate) || 0)
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {item.status === 'locked' && (
                          <p className="mt-2 text-xs text-gray-400">
                            Complete the previous topic's requirements to unlock this topic.
                          </p>
                        )}

                        {isCompleted && (
                          <p className="mt-2 text-xs font-medium text-green-600">
                            Topic mastery requirements completed
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Recommended Topics
        </h2>

        {recommendations.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
            No additional recommendations available yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((item, index) => (
              <article
                key={item.topic || index}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <h3 className="font-semibold text-gray-900">
                  {item.topic}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {item.solved ?? 0} solved out of {item.total ?? 0} questions
                </p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, Number(item.completionRate) || 0)
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  {Number(item.completionRate) || 0}% completed
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-gray-400">
        Topic analysis covers {analysis.length} topics in your active question bank.
      </p>
    </div>
  );
}
