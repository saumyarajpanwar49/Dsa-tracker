import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProblems } from '../hooks/useProblems';
import ProblemTable from '../components/ProblemTable';
import AddProblemModal from '../components/AddProblemModal';
import {
  getQuestions,
  updateQuestionProgress,
} from '../lib/api';
import {
  Plus,
  ArrowLeft,
  Search,
  ExternalLink,
  Loader2,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  ListFilter,
} from 'lucide-react';

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'Todo' },
  { value: 'attempted', label: 'Attempted' },
  { value: 'solved', label: 'Solved' },
  { value: 'needs_revision', label: 'Needs Revision' },
];

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Todo' },
  { value: 'attempted', label: 'Attempted' },
  { value: 'solved', label: 'Solved' },
  { value: 'needs_revision', label: 'Needs Revision' },
];

const DIFFICULTY_STYLES = {
  Easy: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
  Medium: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
  Hard: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
};

const STATUS_STYLES = {
  todo: 'border-zinc-600 bg-zinc-800 text-zinc-200',
  attempted: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  solved: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  needs_revision: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
};

export default function TopicView() {
  const { topic } = useParams();
  const decodedTopic = decodeURIComponent(topic);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const {
    data: manualProblems,
    isLoading: manualLoading,
  } = useProblems({ topic: decodedTopic });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, decodedTopic]);

  useEffect(() => {
    let cancelled = false;

    async function loadQuestions() {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError('');

      try {
        const params = {
          topic: decodedTopic,
          page,
          limit: PAGE_SIZE,
        };

        if (debouncedSearch) {
          params.search = debouncedSearch;
        }

        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }

        const result = await getQuestions(params);

        if (cancelled) return;

        const fetchedQuestions = result.questions || [];
        const pagination = result.pagination || {};

        setQuestions((previous) =>
          page === 1
            ? fetchedQuestions
            : [...previous, ...fetchedQuestions]
        );

        setTotalQuestions(
          typeof pagination.total === 'number'
            ? pagination.total
            : fetchedQuestions.length
        );

        if (typeof pagination.hasMore === 'boolean') {
          setHasMore(pagination.hasMore);
        } else if (typeof pagination.totalPages === 'number') {
          setHasMore(page < pagination.totalPages);
        } else {
          setHasMore(fetchedQuestions.length === PAGE_SIZE);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            'Unable to load questions. Please try again.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }

    loadQuestions();

    return () => {
      cancelled = true;
    };
  }, [decodedTopic, debouncedSearch, statusFilter, page]);

  async function handleProgressChange(questionId, nextStatus) {
    setUpdatingId(questionId);
    setError('');

    try {
      const result = await updateQuestionProgress(questionId, {
        status: nextStatus,
      });

      const updatedProgress =
        result.progress ||
        result.question?.progress ||
        null;

      setQuestions((previous) =>
        previous.map((question) => {
          if (question.id !== questionId) return question;

          return {
            ...question,
            progress: updatedProgress
              ? {
                  ...question.progress,
                  ...updatedProgress,
                }
              : {
                  ...question.progress,
                  status: nextStatus,
                },
          };
        })
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not update question progress.'
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const solvedOnPage = questions.filter(
    (question) => question.progress?.status === 'solved'
  ).length;

  return (
    <div className="min-h-full rounded-2xl bg-[#080808] text-white p-4 sm:p-6 lg:p-7">

      {/* Page header */}
      <div className="mb-7">
        <Link
          to="/topics"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[#FFD700] transition-colors mb-5"
        >
          <ArrowLeft size={16} />
          Back to Topics
        </Link>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/25 flex items-center justify-center">
                <BookOpen size={20} className="text-[#FFD700]" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {decodedTopic}
              </h1>
            </div>

            <p className="text-sm text-zinc-400 ml-1">
              {loading
                ? 'Loading questions...'
                : `${totalQuestions.toLocaleString()} LeetCode questions`}
            </p>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FFD700] hover:bg-[#FFE44D] text-black font-bold text-sm px-5 py-3 transition-all shadow-lg shadow-yellow-500/10 active:scale-95"
          >
            <Plus size={17} />
            Add Problem
          </button>
        </div>
      </div>

      {/* Question bank */}
      <section className="mb-9">

        <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ListFilter size={19} className="text-[#FFD700]" />
              LeetCode Questions
            </h2>

            <p className="text-sm text-zinc-400 mt-1">
              Automatically grouped using LeetCode topics and tags.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span className="text-xs font-medium text-emerald-300">
              {solvedOnPage} solved on this page
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by question title or LeetCode number..."
            className="w-full rounded-xl bg-[#181818] border border-[#3A3A3A] hover:border-[#555555] focus:border-[#FFD700] focus:ring-2 focus:ring-[#FFD700]/15 pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-zinc-400 outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.value;

            return (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-all ${
                  active
                    ? 'bg-[#FFD700] text-black border-[#FFD700] shadow-md shadow-yellow-500/10'
                    : 'bg-[#171717] text-zinc-300 border-[#3A3A3A] hover:border-[#FFD700]/60 hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 mb-5">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center py-20 gap-3 text-zinc-400">
            <Loader2 size={20} className="animate-spin text-[#FFD700]" />
            <span className="text-sm">Loading questions...</span>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-[#444444] bg-[#121212]">
            <BookOpen size={30} className="mx-auto mb-3 text-zinc-500" />

            <p className="text-base font-semibold text-white">
              No questions found
            </p>

            <p className="text-sm text-zinc-400 mt-2">
              Try another search term or status filter.
            </p>

            {(search || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="mt-4 text-sm font-semibold text-[#FFD700] hover:text-[#FFE44D]"
              >
                Clear search and filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((question) => {
              const progress = question.progress || {};
              const currentStatus = progress.status || 'todo';

              return (
                <article
                  key={question.id}
                  className="group rounded-xl border border-[#353535] bg-[#151515] hover:bg-[#1B1B1B] hover:border-[#FFD700]/45 p-4 sm:p-5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">

                    <div className="min-w-0 flex-1">
                      {/* Metadata */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-400 bg-[#242424] border border-[#383838] px-2 py-1 rounded-md">
                          #{question.leetcodeId ?? 'N/A'}
                        </span>

                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                            DIFFICULTY_STYLES[question.difficulty] ||
                            'text-zinc-300 bg-zinc-800 border-zinc-700'
                          }`}
                        >
                          {question.difficulty}
                        </span>

                        {question.paidOnly && (
                          <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-md">
                            Premium
                          </span>
                        )}

                        <span className={`text-xs font-semibold px-2 py-1 rounded-md border ${
                          STATUS_STYLES[currentStatus] || STATUS_STYLES.todo
                        }`}>
                          {STATUS_OPTIONS.find(
                            (option) => option.value === currentStatus
                          )?.label || 'Todo'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-white mt-3 leading-snug group-hover:text-[#FFD700] transition-colors">
                        {question.title}
                      </h3>

                      {question.pattern && (
                        <p className="text-sm text-zinc-300 mt-2">
                          <span className="text-zinc-500">Pattern:</span>{' '}
                          {question.pattern}
                        </p>
                      )}

                      {/* Progress details */}
                      <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-3 text-xs text-zinc-400">
                        <span>
                          Attempts:{' '}
                          <strong className="text-zinc-200">
                            {progress.attempts || 0}
                          </strong>
                        </span>

                        <span>
                          Successful:{' '}
                          <strong className="text-emerald-300">
                            {progress.successfulAttempts || 0}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <select
                        value={currentStatus}
                        disabled={updatingId === question.id}
                        onChange={(event) =>
                          handleProgressChange(
                            question.id,
                            event.target.value
                          )
                        }
                        className="min-w-[145px] rounded-lg bg-[#242424] border border-[#494949] hover:border-[#FFD700]/60 focus:border-[#FFD700] px-3 py-2.5 text-sm font-medium text-white outline-none transition-colors disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {question.url && (
                        <a
                          href={question.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 hover:bg-[#FFD700] hover:text-black text-[#FFD700] px-3.5 py-2.5 text-sm font-bold transition-all"
                        >
                          Solve
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  {updatingId === question.id && (
                    <p className="text-xs text-[#FFD700] mt-3 flex items-center gap-2">
                      <RefreshCw size={13} className="animate-spin" />
                      Updating progress...
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setPage((previous) => previous + 1)}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-xl bg-[#202020] border border-[#454545] hover:border-[#FFD700] hover:text-[#FFD700] text-white font-semibold text-sm px-6 py-3 transition-all disabled:opacity-50"
            >
              {loadingMore && (
                <Loader2 size={16} className="animate-spin" />
              )}
              Load More Questions
            </button>
          </div>
        )}
      </section>

      {/* Custom problems */}
      <section className="border-t border-[#383838] pt-7">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white">
            Custom Problems
          </h2>

          <p className="text-sm text-zinc-400 mt-1">
            Your manually added problems for this topic.
          </p>
        </div>

        <ProblemTable
          problems={manualProblems}
          isLoading={manualLoading}
          emptyMessage={`No custom problems in ${decodedTopic} yet.`}
        />
      </section>

      {showAdd && (
        <AddProblemModal
          defaultTopic={decodedTopic}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
