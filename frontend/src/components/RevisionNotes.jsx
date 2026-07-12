import { useState } from 'react';
import { Trash2, Plus, Loader2, StickyNote, ChevronDown, ChevronUp } from 'lucide-react';
import { useAddRevisionNote, useDeleteRevisionNote } from '../hooks/useProblems';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

export default function RevisionNotes({ problemId, notes = [] }) {
  const [open, setOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const addNote = useAddRevisionNote();
  const deleteNote = useDeleteRevisionNote();

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    await addNote.mutateAsync({ problemId, note: noteText.trim() });
    setNoteText('');
    setShowInput(false);
    setOpen(true); // auto-open to show the new note
  };

  const handleDelete = async (noteId) => {
    await deleteNote.mutateAsync({ problemId, noteId });
  };

  return (
    <div className="border-t border-border/50 mt-3 pt-3">
      {/* Header toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-xs text-muted hover:text-text transition-colors"
        >
          <StickyNote size={12} />
          <span className="font-medium">
            Revision Notes
            {notes.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-warning/15 text-warning rounded text-[10px]">
                {notes.length}
              </span>
            )}
          </span>
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        <button
          onClick={() => { setShowInput(!showInput); setOpen(true); }}
          className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
        >
          <Plus size={12} /> Add Note
        </button>
      </div>

      {/* Add note input */}
      {showInput && (
        <form onSubmit={handleAdd} className="mt-2 space-y-2">
          <textarea
            autoFocus
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
            placeholder="What did you miss? Where were you lagging? Key points to remember next time..."
            className="input-field resize-none text-xs"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowInput(false)}
              className="px-3 py-1 text-xs text-muted hover:text-text border border-border rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addNote.isPending}
              className="px-3 py-1 text-xs bg-warning/10 text-warning border border-warning/30 rounded-lg hover:bg-warning/20 transition-colors flex items-center gap-1.5"
            >
              {addNote.isPending ? <Loader2 size={10} className="animate-spin" /> : null}
              Save Note
            </button>
          </div>
        </form>
      )}

      {/* Notes list */}
      {open && notes.length > 0 && (
        <div className="mt-2 space-y-2">
          {notes.map((n) => (
            <div
              key={n.id}
              className="bg-warning/5 border border-warning/15 rounded-lg p-3 group relative"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap flex-1">
                  {n.note}
                </p>
                <button
                  onClick={() => handleDelete(n.id)}
                  disabled={deleteNote.isPending}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-danger transition-all rounded"
                  title="Delete note"
                >
                  <Trash2 size={11} />
                </button>
              </div>
              <p className="text-[10px] text-muted mt-1.5">{timeAgo(n.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {open && notes.length === 0 && !showInput && (
        <p className="text-xs text-muted mt-2 italic">
          No revision notes yet. Add one when you revisit this problem.
        </p>
      )}
    </div>
  );
}
