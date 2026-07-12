import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useUpdateProblem, useTopics, useCreateTopic } from '../hooks/useProblems';

const STATUS_OPTIONS = ['unsolved', 'solved', 'revisiting'];

export default function EditProblemModal({ problem, onClose }) {
  const [form, setForm] = useState({
    name: problem.name,
    link: problem.link,
    approach: problem.approach,
    topic: problem.topic,
    status: problem.status,
    priority: problem.priority || 'medium',
  });
  const [newTopicInput, setNewTopicInput] = useState('');
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [error, setError] = useState('');

  const { data: topicsData } = useTopics();
  const updateProblem = useUpdateProblem();
  const createTopic = useCreateTopic();

  const topics = topicsData?.topics || [];
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAddTopic = async () => {
    if (!newTopicInput.trim()) return;
    await createTopic.mutateAsync(newTopicInput.trim());
    setForm((f) => ({ ...f, topic: newTopicInput.trim() }));
    setNewTopicInput('');
    setShowNewTopic(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.link.trim() || !form.approach.trim() || !form.topic) {
      setError('All fields are required.');
      return;
    }
    try {
      await updateProblem.mutateAsync({ id: problem.id, data: form });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update problem.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-text text-base">Edit Problem</h2>
          <button onClick={onClose} className="p-1 text-muted hover:text-text rounded transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Problem Name</label>
            <input className="input-field" value={form.name} onChange={set('name')} />
          </div>

          <div>
            <label className="label">Link</label>
            <input className="input-field mono" value={form.link} onChange={set('link')} />
          </div>

          <div>
            <label className="label">Topic</label>
            {showNewTopic ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  className="input-field flex-1"
                  placeholder="New topic name"
                  value={newTopicInput}
                  onChange={(e) => setNewTopicInput(e.target.value)}
                />
                <button type="button" onClick={handleAddTopic} className="btn-primary px-3">
                  {createTopic.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Add'}
                </button>
                <button type="button" onClick={() => setShowNewTopic(false)} className="btn-secondary px-3">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select className="input-field flex-1" value={form.topic} onChange={set('topic')}>
                  {topics.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowNewTopic(true)} className="btn-secondary shrink-0 text-xs">
                  + New
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="label">Status</label>
            <select className="input-field" value={form.status} onChange={set('status')}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Mission Rank</label>
            <div className="flex gap-2">
              {[
                { key: 'high', label: 'S-Rank' },
                { key: 'medium', label: 'A-Rank' },
                { key: 'low', label: 'B-Rank' }
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, priority: p.key }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    form.priority === p.key
                      ? p.key === 'high'
                        ? 'bg-danger/15 text-danger border-danger/40'
                        : p.key === 'medium'
                        ? 'bg-accent/15 text-accent border-accent/40'
                        : 'bg-muted/15 text-muted border-border'
                      : 'bg-transparent text-muted border-border hover:border-muted'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Approach</label>
            <textarea
              className="input-field resize-none"
              rows={5}
              value={form.approach}
              onChange={set('approach')}
            />
          </div>

          {error && <p className="text-danger text-xs">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={updateProblem.isPending}>
              {updateProblem.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Saving…
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
