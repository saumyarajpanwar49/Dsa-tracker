import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Edit2, Trash2, CheckCircle2, RefreshCw, StickyNote } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import RevisionNotes from './RevisionNotes';
import { useUpdateProblem } from '../hooks/useProblems';

export default function ProblemRow({ problem, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const updateProblem = useUpdateProblem();

  const handleStatusChange = async (status) => {
    await updateProblem.mutateAsync({ id: problem.id, data: { status } });
  };

  const noteCount = problem.revisionNotes?.length || 0;

  return (
    <>
      {/* Main row */}
      <tr className="border-b border-border hover:bg-tag-bg/50 transition-colors group">
        {/* Name */}
        <td className="px-4 py-3 min-w-[160px]">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-text text-sm leading-snug">{problem.name}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <StatusBadge status={problem.status} />
              <PriorityBadge priority={problem.priority || 'medium'} />
            </div>
          </div>
        </td>

        {/* Topic */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="px-2 py-0.5 bg-bg border border-border rounded text-xs text-muted mono">
            {problem.topic}
          </span>
        </td>

        {/* Link */}
        <td className="px-4 py-3 max-w-[200px]">
          <a
            href={problem.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mono text-xs text-accent hover:text-accent-hover flex items-center gap-1 group/link"
          >
            <span className="truncate max-w-[160px] block">{problem.link}</span>
            <ExternalLink size={10} className="shrink-0 opacity-60 group-hover/link:opacity-100" />
          </a>
        </td>

        {/* Approach preview */}
        <td className="px-4 py-3 max-w-[260px]">
          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
            {problem.approach}
          </p>
        </td>

        {/* Expand / notes toggle */}
        <td className="px-4 py-3 whitespace-nowrap">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors"
          >
            {noteCount > 0 && (
              <span className="flex items-center gap-1 text-warning">
                <StickyNote size={11} />
                {noteCount}
              </span>
            )}
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </td>

        {/* Actions */}
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-1">
            {problem.status !== 'solved' && (
              <button
                onClick={() => handleStatusChange('solved')}
                title="Mark Solved"
                className="p-1.5 text-muted hover:text-success hover:bg-success/10 rounded transition-colors"
              >
                <CheckCircle2 size={14} />
              </button>
            )}
            {problem.status !== 'revisiting' && (
              <button
                onClick={() => handleStatusChange('revisiting')}
                title="Mark Revisit"
                className="p-1.5 text-muted hover:text-warning hover:bg-warning/10 rounded transition-colors"
              >
                <RefreshCw size={14} />
              </button>
            )}
            {problem.status !== 'unsolved' && (
              <button
                onClick={() => handleStatusChange('unsolved')}
                title="Reset"
                className="p-1.5 text-muted hover:text-text hover:bg-tag-bg rounded transition-colors text-[10px] font-medium"
              >
                ↺
              </button>
            )}
            <button
              onClick={() => onEdit(problem)}
              title="Edit"
              className="p-1.5 text-muted hover:text-accent hover:bg-accent/10 rounded transition-colors"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => onDelete(problem.id)}
              title="Delete"
              className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded sub-row — full approach + revision notes */}
      {expanded && (
        <tr className="border-b border-border bg-bg/60">
          <td colSpan={6} className="px-6 py-4">
            <div className="space-y-4">
              {/* Full approach */}
              <div>
                <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5">
                  Approach
                </p>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {problem.approach}
                </p>
              </div>

              {/* Revision notes */}
              <RevisionNotes
                problemId={problem.id}
                notes={problem.revisionNotes || []}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
