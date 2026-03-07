import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { NLQPanel } from './components/nlq/NLQPanel';
import { NewLiveboardModal } from './components/liveboard/NewLiveboardModal';
import { HomePage } from './pages/HomePage';
import { LiveboardPage } from './pages/LiveboardPage';

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/liveboard/:id" element={<LiveboardPage />} />
          </Routes>
        </main>
      </div>
      <NLQPanel />
      <NewLiveboardModal />
    </div>
  );
}
