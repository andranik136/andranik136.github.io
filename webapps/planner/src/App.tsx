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
  const { initApp, activePlanId, currentView, buckets, addTask, setSelectedTask } = usePlannerStore();

  useEffect(() => {
    initApp();
  }, [initApp]);

  if (!activePlanId) {
    return <div className="flex h-screen items-center justify-center bg-planner-bg text-planner-textMuted">Loading workspace...</div>;
  }

  const handleNewTask = async () => {
    if (!activePlanId || buckets.length === 0) return;
    const firstBucketId = [...buckets].sort((a, b) => a.orderIndex - b.orderIndex)[0].id;
    const newTaskId = await addTask({
      planId: activePlanId,
      bucketId: firstBucketId,
      title: 'New Task',
      description: '',
      status: 'Not Started',
      priority: 'Medium',
      labels: [],
      orderIndex: 0,
    });
    setSelectedTask(newTaskId);
  };

  return (
    <div className="flex h-screen w-full bg-planner-bg overflow-hidden text-planner-text relative">
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
      </div>
      <TaskModal />

      <button
        onClick={handleNewTask}
        className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full flex items-center shadow-lg hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all px-5 py-3.5 group z-50"
      >
        <span className="text-xl font-bold mr-2 leading-none group-hover:scale-110 transition-transform">+</span>
        <span className="font-semibold tracking-wide">New Task</span>
      </button>

    </div>
  );
}

export default App;
