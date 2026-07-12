import { useState } from 'react';
import { useStats, useTriggerReminders } from '../hooks/useProblems';
import {
  BookOpen,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Flame,
  Send,
  Loader2,
} from 'lucide-react';

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
