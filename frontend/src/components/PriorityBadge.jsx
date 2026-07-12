const PRIORITY_CONFIG = {
  high: {
    label: 'S-Rank',
    classes: 'bg-danger/10 text-danger border-danger/30 font-bold',
    dot: 'bg-danger animate-pulse',
  },
  medium: {
    label: 'A-Rank',
    classes: 'bg-accent/10 text-accent border-accent/30 font-semibold',
    dot: 'bg-accent',
  },
  low: {
    label: 'B-Rank',
    classes: 'bg-muted/10 text-muted border-border',
    dot: 'bg-muted',
  },
};

export default function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
