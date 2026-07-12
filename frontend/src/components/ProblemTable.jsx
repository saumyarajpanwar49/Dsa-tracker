import { useState } from 'react';
import ProblemRow from './ProblemCard';
import EditProblemModal from './EditProblemModal';
import { useDeleteProblem } from '../hooks/useProblems';
import { Loader2, SearchX } from 'lucide-react';

const COLUMNS = [
  { label: 'Name / Status', width: 'w-[200px]' },
  { label: 'Topic', width: 'w-[120px]' },
  { label: 'Link', width: 'w-[200px]' },
  { label: 'Approach', width: '' },
  { label: '', width: 'w-[60px]' },   // expand toggle
  { label: 'Actions', width: 'w-[160px]' },
];

export default function ProblemTable({ problems, isLoading, emptyMessage = 'No problems found.' }) {
  const [editingProblem, setEditingProblem] = useState(null);
  const deleteProblem = useDeleteProblem();

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this problem?')) return;
    await deleteProblem.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted gap-2">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Loading problems…</span>
      </div>
    );
  }

  if (!problems || problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted gap-3">
        <SearchX size={36} className="opacity-40" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              {COLUMNS.map((col, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-widest ${col.width}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {problems.map((p) => (
              <ProblemRow
                key={p.id}
                problem={p}
                onEdit={setEditingProblem}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {editingProblem && (
        <EditProblemModal
          problem={editingProblem}
          onClose={() => setEditingProblem(null)}
        />
      )}
    </>
  );
}
