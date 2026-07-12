import { useState } from 'react';
import { useProblems } from '../hooks/useProblems';
import ProblemTable from '../components/ProblemTable';
import AddProblemModal from '../components/AddProblemModal';
import { Plus, Search } from 'lucide-react';

const STATUS_FILTERS = ['all', 'unsolved', 'solved', 'revisiting'];

export default function AllProblems() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  const filters = {};
  if (statusFilter !== 'all') filters.status = statusFilter;

  const { data: problems, isLoading } = useProblems(filters);

  const filtered = (problems || []).filter((p) =>
    search.trim() === ''
      ? true
      : p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.topic.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-text">All Problems</h1>
          <p className="text-sm text-muted mt-0.5">
            {isLoading ? '…' : `${filtered.length} problem${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Problem
        </button>
      </div>

      {/* Search + filter row */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            className="input-field pl-8"
            placeholder="Search by name or topic…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
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
      </div>

      <ProblemTable
        problems={filtered}
        isLoading={isLoading}
        emptyMessage="No problems found. Add your first one!"
      />

      {showAdd && <AddProblemModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
