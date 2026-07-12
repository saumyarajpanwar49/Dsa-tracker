import { useState } from 'react';
import TopicGrid from '../components/TopicGrid';
import AddProblemModal from '../components/AddProblemModal';
import { Plus } from 'lucide-react';

export default function TopicsPage() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text">Topics</h1>
          <p className="text-sm text-muted mt-0.5">Click a topic to view its problems</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Problem
        </button>
      </div>
      <TopicGrid />
      {showAdd && <AddProblemModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
