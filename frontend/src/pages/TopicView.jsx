import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProblems } from '../hooks/useProblems';
import ProblemTable from '../components/ProblemTable';
import AddProblemModal from '../components/AddProblemModal';
import { Plus, ArrowLeft } from 'lucide-react';

const STATUS_FILTERS = ['all', 'unsolved', 'solved', 'revisiting'];

export default function TopicView() {
  const { topic } = useParams();
  const decodedTopic = decodeURIComponent(topic);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  const filters = { topic: decodedTopic };
  if (statusFilter !== 'all') filters.status = statusFilter;

  const { data: problems, isLoading } = useProblems(filters);

  return (
    <div>
      {/* Breadcrumb */}
      <Link
        to="/topics"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent mb-4 transition-colors"
      >
        <ArrowLeft size={12} /> Topics
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-text">{decodedTopic}</h1>
          <p className="text-sm text-muted mt-0.5">
            {isLoading ? '…' : `${problems?.length ?? 0} problem${problems?.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Problem
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
              statusFilter === s
                ? 'bg-accent/10 text-accent border-accent/30'
                : 'text-muted border-border hover:border-muted hover:text-text'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <ProblemTable
        problems={problems}
        isLoading={isLoading}
        emptyMessage={`No ${statusFilter !== 'all' ? statusFilter + ' ' : ''}problems in ${decodedTopic} yet.`}
      />

      {showAdd && (
        <AddProblemModal defaultTopic={decodedTopic} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}
