import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTopics, useProblems } from '../hooks/useProblems';
import { getQuestionTopicSummary } from '../lib/api';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Loader2, CheckCircle2 } from 'lucide-react';

const TOPIC_COLORS = [
  'bg-[#171b2a] border-[#303956] hover:border-[#596b9e]',
  'bg-[#201719] border-[#493034] hover:border-[#75474e]',
  'bg-[#211d16] border-[#4b3d29] hover:border-[#79613c]',
  'bg-[#211f16] border-[#494329] hover:border-[#756a3d]',
  'bg-[#17211d] border-[#30483b] hover:border-[#4c705b]',
  'bg-[#162025] border-[#304651] hover:border-[#4b7180]',
];

export default function TopicGrid() {
  const navigate = useNavigate();

  const { data: topicsData, isLoading: topicsLoading } = useTopics();
  const { data: allProblems } = useProblems();

  const {
    data: questionSummary,
    isLoading: questionTopicsLoading,
    isError: questionTopicsError,
  } = useQuery({
    queryKey: ['question-topic-summary'],
    queryFn: getQuestionTopicSummary,
    staleTime: 30000,
  });

  const manualTopics = topicsData?.topics || [];
  const questionTopics = questionSummary?.topics || [];

  const topics = useMemo(() => {
    const topicMap = new Map();

    for (const topic of manualTopics) {
      const name = typeof topic === 'string' ? topic : topic.name;

      if (name) {
        topicMap.set(name.toLowerCase(), {
          name,
          total: 0,
          solved: 0,
          attempted: 0,
          hasQuestionBank: false,
        });
      }
    }

    for (const topic of questionTopics) {
      const key = topic.name.toLowerCase();
      const existing = topicMap.get(key);

      topicMap.set(key, {
        name: existing?.name || topic.name,
        total: topic.total,
        solved: topic.solved,
        attempted: topic.attempted,
        hasQuestionBank: true,
      });
    }

    return [...topicMap.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [manualTopics, questionTopics]);

  const countForTopic = (topic) =>
    (allProblems || []).filter(
      (problem) =>
        problem.topic?.toLowerCase() === topic.name.toLowerCase()
    ).length;

  if (topicsLoading || questionTopicsLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted gap-2">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Loading topics...</span>
      </div>
    );
  }

  return (
    <div>
      {questionTopicsError && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
          Could not load LeetCode topic statistics. Please refresh the page.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {topics.map((topic, i) => {
          const colorClass = TOPIC_COLORS[i % TOPIC_COLORS.length];
          const manualCount = countForTopic(topic);

          return (
            <button
              key={topic.name}
              onClick={() =>
                navigate(`/topics/${encodeURIComponent(topic.name)}`)
              }
              className={`${colorClass} border rounded-xl p-4 text-left transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 active:scale-[0.98] group`}
            >
              <BookOpen
                size={20}
                className="text-slate-500 group-hover:text-slate-300 mb-3 transition-colors"
              />

              <p className="font-semibold text-slate-200 text-sm leading-tight">
                {topic.name}
              </p>

              {topic.hasQuestionBank ? (
                <>
                  <p className="text-xs text-slate-400 mt-2">
                    {topic.total.toLocaleString()} LeetCode questions
                  </p>

                  <div className="flex items-center gap-1 mt-1.5 text-xs text-emerald-400/80">
                    <CheckCircle2 size={12} />
                    <span>
                      {topic.solved.toLocaleString()} solved
                    </span>
                  </div>

                  {manualCount > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      + {manualCount} custom problems
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400 mt-2">
                  {manualCount} {manualCount === 1 ? 'problem' : 'problems'}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {topics.length === 0 && (
        <div className="text-center py-16 text-muted text-sm">
          No topics found.
        </div>
      )}
    </div>
  );
}
