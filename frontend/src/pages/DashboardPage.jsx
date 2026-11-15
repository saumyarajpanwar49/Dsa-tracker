import Dashboard from '../components/Dashboard';
import TrialCountdown from '../components/TrialCountdown';

export default function DashboardPage() {
  return (
    <div>
      <TrialCountdown />

      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Dashboard</h1>
        <p className="text-sm text-muted mt-0.5">
          Your DSA revision overview
        </p>
      </div>

      <Dashboard />
    </div>
  );
}