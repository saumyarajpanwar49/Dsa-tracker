import { useNavigate } from 'react-router-dom';
import { useTopics, useProblems } from '../hooks/useProblems';
import { BookOpen, Loader2 } from 'lucide-react';

const TOPIC_COLORS = [
  'from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-400/50',
  'from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-400/50',
  'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-400/50',
  'from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:border-amber-400/50',
  'from-rose-500/10 to-rose-600/5 border-rose-500/20 hover:border-rose-400/50',
  'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 hover:border-cyan-400/50',
  'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 hover:border-indigo-400/50',
  'from-orange-500/10 to-orange-600/5 border-orange-500/20 hover:border-orange-400/50',
];

export default function TopicGrid() {
  const navigate = useNavigate();
  const { data: topicsData, isLoading: topicsLoading } = useTopics();
  const { data: allProblems } = useProblems();

  const topics = topicsData?.topics || [];

  const countForTopic = (topic) =>
    (allProblems || []).filter((p) => p.topic === topic).length;

  if (topicsLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted gap-2">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Loading topics…</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {topics.map((topic, i) => {
        const colorClass = TOPIC_COLORS[i % TOPIC_COLORS.length];
        const count = countForTopic(topic);
        return (
          <button
            key={topic}
            onClick={() => navigate(`/topics/${encodeURIComponent(topic)}`)}
            className={`bg-gradient-to-br ${colorClass} border rounded-xl p-4 text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] group`}
          >
            <BookOpen
              size={20}
              className="text-muted group-hover:text-text mb-3 transition-colors"
            />
            <p className="font-semibold text-text text-sm leading-tight">{topic}</p>
            <p className="text-xs text-muted mt-1">
              {count} {count === 1 ? 'problem' : 'problems'}
            </p>
          </button>
        );
      })}
    </div>
  );
}
