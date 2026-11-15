import { useEffect, useState } from 'react';

import {
  Search,
  ExternalLink,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  Clock,
  Target,
  X,
  Loader2,
} from 'lucide-react';

import {
  getQuestions,
  getQuestionFilters,
  updateQuestionProgress,
} from '../lib/api';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Todo' },
  { value: 'attempted', label: 'Attempted' },
  { value: 'solved', label: 'Solved' },
  { value: 'needs_revision', label: 'Needs Revision' },
];

const DIFFICULTY_STYLES = {
  Easy: 'text-green-400 bg-green-400/10',
  Medium: 'text-yellow-400 bg-yellow-400/10',
  Hard: 'text-red-400 bg-red-400/10',
};

const PAGE_SIZE = 20;

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [patterns, setPatterns] = useState([]);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [topic, setTopic] = useState('');
  const [pattern, setPattern] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('');

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadFilters() {
      try {
        const data = await getQuestionFilters();
        setTopics(data.topics || []);
        setPatterns(data.patterns || []);
      } catch (err) {
        console.error('Could not load question filters:', err);
      }
    }

    loadFilters();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  // Load the first page whenever search or filters change.
  useEffect(() => {
    let cancelled = false;

    async function loadQuestions() {
      setLoading(true);
      setLoadingMore(false);
      setError('');
      setPage(1);
      setQuestions([]);

      try {
        const params = {
          page: 1,
          limit: PAGE_SIZE,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          ...(topic ? { topic } : {}),
          ...(pattern ? { pattern } : {}),
          ...(difficulty ? { difficulty } : {}),
          ...(status ? { status } : {}),
        };

        const data = await getQuestions(params);

        if (!cancelled) {
          const items = data.questions || [];
          const pagination = data.pagination || {};

          setQuestions(items);
          setTotal(pagination.total || 0);
          setHasMore((pagination.page || 1) < (pagination.totalPages || 0));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.error ||
              'Could not load questions. Please try again.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadQuestions();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, topic, pattern, difficulty, status]);

  // Load the next page when the user reaches the bottom.
  async function loadMoreQuestions() {
    if (loading || loadingMore || !hasMore) return;

    const nextPage = page + 1;
    setLoadingMore(true);
    setError('');

    try {
      const params = {
        page: nextPage,
        limit: PAGE_SIZE,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(topic ? { topic } : {}),
        ...(pattern ? { pattern } : {}),
        ...(difficulty ? { difficulty } : {}),
        ...(status ? { status } : {}),
      };

      const data = await getQuestions(params);
      const newQuestions = data.questions || [];
      const pagination = data.pagination || {};

      setQuestions((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        const uniqueNewQuestions = newQuestions.filter(
          (item) => !existingIds.has(item.id)
        );

        return [...current, ...uniqueNewQuestions];
      });

      setPage(nextPage);
      setTotal(pagination.total || 0);
      setHasMore(nextPage < (pagination.totalPages || 0));
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Could not load more questions. Please try again.'
      );
    } finally {
      setLoadingMore(false);
    }
  }

  // Infinite scroll listener.
  useEffect(() => {
    function handleScroll() {
      if (loading || loadingMore || !hasMore) return;

      const distanceFromBottom =
        document.documentElement.scrollHeight -
        (window.scrollY + window.innerHeight);

      if (distanceFromBottom < 500) {
        loadMoreQuestions();
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [
    loading,
    loadingMore,
    hasMore,
    page,
    debouncedSearch,
    topic,
    pattern,
    difficulty,
    status,
  ]);

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
  };

  async function handleProgressChange(question, newStatus) {
    setUpdatingId(question.id);
    setError('');

    try {
      const data = await updateQuestionProgress(question.id, {
        status: newStatus,
      });

      setQuestions((current) =>
        current.map((item) =>
          item.id === question.id
            ? { ...item, progress: data.progress }
            : item
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Could not update question progress.'
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const solvedCount = questions.filter(
    (question) => question.progress?.status === 'solved'
  ).length;

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setTopic('');
    setPattern('');
    setDifficulty('');
    setStatus('');
  };

  const hasActiveFilters =
    search || topic || pattern || difficulty || status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">
            Question Bank
          </h1>

          <p className="text-sm text-muted mt-1">
            Practice, track and master your DSA journey.
          </p>
        </div>

        <div className="flex items-center gap-2 text-accent">
          <BookOpen size={20} />
          <span className="font-semibold">
            {total.toLocaleString()} Questions
          </span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card">
          <div className="flex items-center gap-2 text-muted text-sm">
            <BookOpen size={16} />
            Matching Questions
          </div>

          <p className="text-2xl font-bold text-text mt-2">
            {total.toLocaleString()}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-muted text-sm">
            <CheckCircle2 size={16} />
            Solved Loaded
          </div>

          <p className="text-2xl font-bold text-green-400 mt-2">
            {solvedCount}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-muted text-sm">
            <Target size={16} />
            Questions Displayed
          </div>

          <p className="text-2xl font-bold text-accent mt-2">
            {questions.length.toLocaleString()} / {total.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card space-y-4">
        <div>
          <label className="text-sm font-medium text-text block mb-2">
            Search LeetCode Questions
          </label>

          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />

            <input
              className="input-field pl-11 pr-11 py-3"
              placeholder="Enter question name or LeetCode number (e.g. Two Sum or 1)"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <p className="text-xs text-muted mt-2">
            Search by question title or exact LeetCode problem number.
            Results update automatically.
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            className="input-field"
            value={topic}
            onChange={handleFilterChange(setTopic)}
          >
            <option value="">All Topics</option>
            {topics.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            className="input-field"
            value={pattern}
            onChange={handleFilterChange(setPattern)}
          >
            <option value="">All Patterns</option>
            {patterns.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            className="input-field"
            value={difficulty}
            onChange={handleFilterChange(setDifficulty)}
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <select
            className="input-field"
            value={status}
            onChange={handleFilterChange(setStatus)}
          >
            <option value="">All Progress</option>
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-muted">
            {topics.length} topics · {patterns.length} patterns available
          </p>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-accent hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-red-500/30 bg-red-500/10 text-red-400 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {/* Search results heading */}
      {!loading && debouncedSearch && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Search results for <span className="text-text font-semibold">"{debouncedSearch}"</span>
          </p>
          <span className="text-xs text-muted">
            {total} found
          </span>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-3">
        {loading ? (
          <div className="card flex items-center justify-center gap-3 py-12 text-muted">
            <RefreshCw size={18} className="animate-spin" />
            Loading questions...
          </div>
        ) : questions.length === 0 ? (
          <div className="card text-center py-12">
            <BookOpen
              size={32}
              className="mx-auto text-muted mb-3"
            />

            <h3 className="font-semibold text-text">
              No questions found
            </h3>

            <p className="text-sm text-muted mt-1">
              Try another question name, LeetCode number or filter.
            </p>
          </div>
        ) : (
          questions.map((question) => (
            <div
              key={question.id}
              className="card hover:border-accent/40 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Question Information */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs text-muted mono">
                      #{question.leetcodeId || 'N/A'}
                    </span>

                    <span
                      className={`text-xs px-2 py-1 rounded-md ${
                        DIFFICULTY_STYLES[question.difficulty] ||
                        'text-muted bg-tag-bg'
                      }`}
                    >
                      {question.difficulty}
                    </span>

                    {question.paidOnly && (
                      <span className="text-xs px-2 py-1 rounded-md text-yellow-400 bg-yellow-400/10">
                        Premium
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-text">
                    {question.title}
                  </h3>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-accent bg-accent/10 px-2 py-1 rounded-md">
                      {question.topic}
                    </span>

                    {question.pattern && (
                      <span className="text-xs text-muted bg-tag-bg px-2 py-1 rounded-md">
                        {question.pattern}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Attempts: {question.progress?.attempts || 0}
                    </span>

                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Solves: {question.progress?.successfulAttempts || 0}
                    </span>
                  </div>
                </div>

                {/* Progress and Solve */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="input-field min-w-[145px]"
                    value={question.progress?.status || 'todo'}
                    disabled={updatingId === question.id}
                    onChange={(event) =>
                      handleProgressChange(question, event.target.value)
                    }
                  >
                    {STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <a
                    href={question.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex items-center gap-2 whitespace-nowrap"
                  >
                    Solve
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Infinite scroll loader */}
      {!loading && questions.length > 0 && (
        <div className="py-5 text-center">
          {loadingMore ? (
            <div className="flex items-center justify-center gap-2 text-muted text-sm">
              <Loader2 size={18} className="animate-spin" />
              Loading more questions...
            </div>
          ) : hasMore ? (
            <button
              type="button"
              onClick={loadMoreQuestions}
              className="btn-secondary"
            >
              Load more questions
            </button>
          ) : (
            <p className="text-sm text-muted">
              You've reached the end of the question list.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
