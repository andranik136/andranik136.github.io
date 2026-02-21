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

import { Plus } from 'lucide-react';

function App() {
  const { initApp, activePlanId, currentView, buckets, addTask, setSelectedTask } = usePlannerStore();

  useEffect(() => {
    initApp();
  }, [initApp]);

  const handleAddNewTask = async () => {
    if (!activePlanId || buckets.length === 0) return;
    const newTaskId = await addTask({
      planId: activePlanId,
      bucketId: buckets[0].id,
      title: 'New Task',
      description: '',
      status: 'Not Started',
      priority: 'Medium',
      labels: [],
      orderIndex: 0
    });
    setSelectedTask(newTaskId);
  };

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
        </main>

        {/* Floating Action Button */}
        <button
          onClick={handleAddNewTask}
          className="fixed bottom-8 right-8 w-14 h-14 bg-planner-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all z-40 hover:scale-105 active:scale-95"
          title="Create New Task"
        >
          <Plus size={24} />
        </button>
      </div>
      <TaskModal />
    </div>
  );
}

export default App;
