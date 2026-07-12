import { cn } from '../lib/utils';

const STATUS_CONFIG = {
  solved: {
    label: 'Solved',
    classes: 'bg-success/10 text-success border-success/30',
  },
  revisiting: {
    label: 'Revisiting',
    classes: 'bg-warning/10 text-warning border-warning/30',
  },
  unsolved: {
    label: 'Unsolved',
    classes: 'bg-muted/10 text-muted border-border',
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unsolved;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
