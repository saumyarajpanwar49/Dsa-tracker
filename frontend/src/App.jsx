import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import TopicsPage from './pages/TopicsPage';
import TopicView from './pages/TopicView';
import AllProblems from './pages/AllProblems';

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/topics/:topic" element={<TopicView />} />
            <Route path="/problems" element={<AllProblems />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
