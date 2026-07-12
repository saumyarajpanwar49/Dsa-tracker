const PRIORITY_CONFIG = {
  high: {
    label: 'High',
    classes: 'bg-danger/10 text-danger border-danger/30',
    dot: 'bg-danger',
  },
  medium: {
    label: 'Medium',
    classes: 'bg-warning/10 text-warning border-warning/30',
    dot: 'bg-warning',
  },
  low: {
    label: 'Low',
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
