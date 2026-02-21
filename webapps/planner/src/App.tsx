import { useEffect } from 'react';
import { usePlannerStore } from './store/usePlannerStore';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BoardView } from './features/board/BoardView';
import { TaskModal } from './features/task-modal/TaskModal';
import { GridView } from './features/views/GridView';
import { ScheduleView } from './features/views/ScheduleView';
import { ChartsView } from './features/views/ChartsView';
import { MyDayView } from './features/views/MyDayView';

function App() {
  const { initApp, activePlanId, currentView } = usePlannerStore();

  useEffect(() => {
    initApp();
  }, [initApp]);

  if (!activePlanId) {
    return <div className="flex h-screen items-center justify-center bg-planner-bg text-planner-textMuted">Loading workspace...</div>;
  }

  return (
    <div className="flex h-screen w-full bg-planner-bg overflow-hidden text-planner-text">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto relative">
          {currentView === 'Board' && <BoardView />}
          {currentView === 'Grid' && <GridView />}
          {currentView === 'Schedule' && <ScheduleView />}
          {currentView === 'Charts' && <ChartsView />}
          {currentView === 'MyDay' && <MyDayView />}
          {currentView === 'Hub' && <div className="p-8 text-gray-500 flex justify-center items-center h-full">Plan Hub View Placeholder</div>}
        </main>
      </div>
      <TaskModal />
    </div>
  );
}

export default App;
