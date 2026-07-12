import { useState, useEffect } from 'react';
import { useStats, useTriggerReminders } from '../hooks/useProblems';
import {
  BookOpen,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Flame,
  Send,
  Loader2,
  Quote,
} from 'lucide-react';
import { getRandomQuote } from '../lib/quotes';

function StatCard({ icon: Icon, label, value, colorClass, subText }) {
  return (
    <div className="card-hover flex items-start gap-4 p-5">
      <div className={`p-2.5 rounded-xl ${colorClass} shrink-0`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold text-text">{value ?? '—'}</p>
        <p className="text-sm text-muted font-medium">{label}</p>
        {subText && <p className="text-xs text-muted/60 mt-0.5">{subText}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();
  const triggerReminders = useTriggerReminders();
  const [reminderMsg, setReminderMsg] = useState('');
  const [quote, setQuote] = useState({ text: '', source: '', series: '' });

  useEffect(() => {
    setQuote(getRandomQuote());
  }, []);

  const handleRefreshQuote = () => {
    setQuote(getRandomQuote());
  };

  const handleTrigger = async () => {
    try {
      const result = await triggerReminders.mutateAsync();
      setReminderMsg(
        result.sent === 0
          ? 'No problems due for reminder right now.'
          : `✅ Sent reminders for ${result.sent} problem(s)!`
      );
    } catch {
      setReminderMsg('❌ Failed to send reminders. Check your email config.');
    }
    setTimeout(() => setReminderMsg(''), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Quote Banner */}
      {quote.text && (
        <div className="relative card p-6 bg-gradient-to-r from-card to-bg border border-border/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden rounded-xl group/quote">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-accent/70">
              <Quote size={16} />
              <span className="text-[10px] uppercase font-semibold tracking-widest text-muted">{quote.series}</span>
            </div>
            <p className="text-text font-medium text-sm md:text-base italic leading-relaxed">
              "{quote.text}"
            </p>
            <p className="text-xs text-muted font-mono">
              — <span className="text-accent">{quote.source}</span>
            </p>
          </div>
          <button
            onClick={handleRefreshQuote}
            className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 select-none shrink-0"
            title="Next quote"
          >
            <RefreshCw size={12} className="group-hover/quote:rotate-180 transition-transform duration-500" />
            Shuffle Quote
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={BookOpen}
          label="Total Problems"
          value={isLoading ? '…' : stats?.total}
          colorClass="bg-accent/10 text-accent"
        />
        <StatCard
          icon={CheckCircle2}
          label="Solved"
          value={isLoading ? '…' : stats?.solved}
          colorClass="bg-success/10 text-success"
          subText={stats ? `${Math.round((stats.solved / (stats.total || 1)) * 100)}% done` : ''}
        />
        <StatCard
          icon={RefreshCw}
          label="Revisiting"
          value={isLoading ? '…' : stats?.revisiting}
          colorClass="bg-warning/10 text-warning"
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={isLoading ? '…' : `${stats?.streak ?? 0}d`}
          colorClass="bg-rose-500/10 text-rose-400"
          subText="consecutive days"
        />
      </div>

      {/* Progress bar */}
      {!isLoading && stats?.total > 0 && (
        <div className="card p-4">
          <div className="flex justify-between text-xs text-muted mb-2">
            <span>Progress</span>
            <span>{stats.solved} / {stats.total} solved</span>
          </div>
          <div className="h-2 bg-tag-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-success rounded-full transition-all duration-500"
              style={{ width: `${(stats.solved / stats.total) * 100}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success inline-block" />
              Solved: {stats.solved}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-warning inline-block" />
              Revisiting: {stats.revisiting}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted inline-block" />
              Unsolved: {stats.unsolved}
            </span>
          </div>
        </div>
      )}

      {/* Reminder trigger */}
      <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-text text-sm">Email Reminders</h3>
          <p className="text-xs text-muted mt-0.5">
            Daily at 9 AM — queries unsolved problems older than 5 days. Or trigger manually:
          </p>
          {reminderMsg && (
            <p className="text-xs text-accent mt-1.5">{reminderMsg}</p>
          )}
        </div>
        <button
          onClick={handleTrigger}
          disabled={triggerReminders.isPending}
          className="btn-secondary flex items-center gap-2 shrink-0"
        >
          {triggerReminders.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          Send Reminders Now
        </button>
      </div>
    </div>
  );
}
