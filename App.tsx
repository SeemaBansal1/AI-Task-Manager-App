import React, { useState, useEffect } from 'react';
import { Plus, Flame, BrainCircuit, Layout, List, Search, Trash2, ChevronDown, ChevronUp, History, Trophy } from 'lucide-react';
import { Task, TaskStatus, UserStats, ReminderMethod } from './types';
import * as Storage from './services/storageService';
import * as Gemini from './services/geminiService';
import TaskCard from './components/TaskCard';
import { SortableTaskItem } from './components/SortableTaskItem';
import AddEditTaskModal from './components/AddEditTaskModal';
import MotivationalPopup from './components/MotivationalPopup';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<UserStats>(Storage.getStats());
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showMorningPopup, setShowMorningPopup] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [viewMode, setViewMode] = useState<'LIST' | 'DASHBOARD'>('LIST');
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // New State Features
  const [searchQuery, setSearchQuery] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['Professional', 'Hobby']);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initial Load
  useEffect(() => {
    let loadedTasks = Storage.getTasks();
    
    // Migration logic
    loadedTasks = loadedTasks.map(t => ({
      ...t,
      // @ts-ignore
      category: t.category || (t.type === 'PROFESSIONAL' ? 'Professional' : t.type === 'HOBBY' ? 'Hobby' : 'General')
    }));

    setTasks(loadedTasks);
    
    const existingCats = Array.from(new Set(loadedTasks.map(t => t.category)));
    setCategories(prev => Array.from(new Set([...prev, ...existingCats])));

    // Check streak on load (resets if broken)
    const updatedStats = Storage.checkStreakOnLoad();
    setStats(updatedStats);

    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 11 && loadedTasks.filter(t => t.status !== TaskStatus.DONE).length > 0) {
      setShowMorningPopup(true);
    }
    
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Save on change
  useEffect(() => {
    Storage.saveTasks(tasks);
    Storage.saveStats(stats);
    
    const usedCats = Array.from(new Set(tasks.map(t => t.category)));
    setCategories(prev => Array.from(new Set([...prev, ...usedCats])));

  }, [tasks, stats]);

  // Reminder Check Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentIsoMinute = now.toISOString().slice(0, 16); 

      setTasks(prevTasks => {
        let hasUpdates = false;
        const updatedTasks = prevTasks.map(task => {
           if (task.reminder && !task.reminder.notified && task.reminder.method === ReminderMethod.NOTIFICATION) {
             if (task.reminder.dateTime.startsWith(currentIsoMinute)) {
               if (Notification.permission === 'granted') {
                 new Notification(`Reminder: ${task.title}`, {
                   body: `Time to work on: ${task.title}`,
                   icon: '/favicon.ico' 
                 });
               } else {
                 alert(`Reminder: ${task.title}`);
               }
               hasUpdates = true;
               return { ...task, reminder: { ...task.reminder, notified: true } };
             }
           }
           return task;
        });
        return hasUpdates ? updatedTasks : prevTasks;
      });
    }, 30000); 

    return () => clearInterval(interval);
  }, []);

  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      try { return crypto.randomUUID(); } catch (e) {}
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
      setEditingTask(null);
    } else {
      const task: Task = {
        ...taskData,
        id: generateId(),
        createdAt: Date.now(),
        status: TaskStatus.TODO,
        subtasks: taskData.subtasks || [],
        links: taskData.links || []
      };
      setTasks(prev => [task, ...prev]);
    }
    setIsAddModalOpen(false);
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return {
           ...t, 
           status, 
           completedAt: status === TaskStatus.DONE ? Date.now() : undefined
        };
      }
      return t;
    }));
    
    if (status === TaskStatus.DONE) {
      // Use helper to handle streak logic
      const newStats = Storage.registerTaskCompletion();
      setStats(newStats);
    }
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: (t.subtasks || []).map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
      };
    }));
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      setTasks(prev => prev.filter(t => t.id !== taskToDelete));
      setTaskToDelete(null);
    }
  };

  const handleSmartSort = async () => {
    setIsSorting(true);
    const todoTasks = tasks.filter(t => t.status !== TaskStatus.DONE);
    const doneTasks = tasks.filter(t => t.status === TaskStatus.DONE);
    
    if (todoTasks.length > 0) {
      const sortedIds = await Gemini.getSmartPrioritization(todoTasks);
      const sortedTodos = sortedIds
        .map(id => todoTasks.find(t => t.id === id))
        .filter((t): t is Task => t !== undefined);
        
      const missing = todoTasks.filter(t => !sortedIds.includes(t.id));
      setTasks([...sortedTodos, ...missing, ...doneTasks]);
    }
    setIsSorting(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((t) => t.id === active.id);
        const newIndex = items.findIndex((t) => t.id === over?.id);
        
        // Ensure both items exist before moving
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(items, oldIndex, newIndex);
        }
        return items;
      });
    }
  };

  // Filter Logic
  const filteredTasks = tasks.filter(t => {
    if (filterCategory !== 'ALL' && t.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  const activeTasks = filteredTasks.filter(t => t.status !== TaskStatus.DONE);
  // Sort done tasks by completedAt if available, newest first
  const doneTasks = filteredTasks.filter(t => t.status === TaskStatus.DONE).sort((a, b) => {
    return (b.completedAt || 0) - (a.completedAt || 0);
  });

  // Dynamic Pie Data
  const pieData = categories.map((cat, idx) => ({
    name: cat,
    value: tasks.filter(t => t.category === cat).length,
    color: ['#0ea5e9', '#ec4899', '#8b5cf6', '#f59e0b', '#14b8a6'][idx % 5]
  })).filter(d => d.value > 0);

  return (
    <div className="min-h-screen pb-20 font-sans text-gray-800 bg-brand-50">
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
              <img 
                src="https://api.dicebear.com/9.x/bottts/svg?seed=YourBuddy" 
                alt="Your Buddy Logo" 
                className="w-14 h-14 rounded-xl shadow-lg shadow-blue-200 bg-white"
              />
              <h1 className="text-2xl font-display font-bold text-gray-800 tracking-tight hidden sm:block">Your Buddy</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 text-orange-600 font-bold text-sm">
                  <Flame size={16} className="fill-orange-500" />
                  <span>{stats.streak} Days</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-fun-purple focus:ring-2 focus:ring-fun-purple/10 outline-none transition-all"
            />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Navigation / Filter Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
           <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
             <button 
               onClick={() => setFilterCategory('ALL')}
               className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterCategory === 'ALL' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
             >
               All
             </button>
             {categories.map(cat => (
               <button 
                 key={cat}
                 onClick={() => setFilterCategory(cat)}
                 className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterCategory === cat ? 'bg-brand-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
               >
                 {cat}
               </button>
             ))}
           </div>

           <div className="flex self-end bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
              <button
                onClick={() => setViewMode('LIST')}
                 className={`p-2 rounded-xl transition-all ${viewMode === 'LIST' ? 'bg-fun-purple/10 text-fun-purple' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                <List size={20} />
              </button>
              <button
                onClick={() => setViewMode('DASHBOARD')}
                 className={`p-2 rounded-xl transition-all ${viewMode === 'DASHBOARD' ? 'bg-fun-purple/10 text-fun-purple' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                <Layout size={20} />
              </button>
           </div>
        </div>

        {viewMode === 'DASHBOARD' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
             {/* Streak Card - Prominently displayed */}
             <div className="md:col-span-2 bg-gradient-to-r from-orange-400 to-orange-600 p-6 rounded-3xl shadow-lg text-white flex items-center justify-between">
                <div>
                   <h3 className="font-display font-bold text-2xl">Productivity Streak</h3>
                   <p className="text-white/80 mt-1">Keep the fire burning! Complete a task daily.</p>
                </div>
                <div className="flex flex-col items-center">
                   <Flame size={48} className="fill-white animate-pulse" />
                   <span className="text-4xl font-bold font-display">{stats.streak}</span>
                   <span className="text-xs uppercase tracking-wider font-bold opacity-80">Days</span>
                </div>
             </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-display font-bold text-lg mb-4 text-gray-700">Task Categories</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-xs font-bold text-gray-500">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div> {d.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-fun-purple to-indigo-600 p-6 rounded-3xl shadow-lg text-white flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-2xl opacity-90">Total Impact</h3>
                <p className="opacity-70 text-sm mt-1">Tasks completed since joining</p>
              </div>
              <div className="flex items-center gap-4">
                 <Trophy size={48} className="text-yellow-300" />
                 <div className="text-6xl font-display font-bold">{stats.tasksCompletedTotal}</div>
              </div>
              <div className="mt-4 bg-white/20 backdrop-blur-sm p-3 rounded-xl text-sm font-medium">
                "Small steps every day lead to giant leaps."
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-gray-700">
                {searchQuery ? `Searching "${searchQuery}"` : `Upcoming (${activeTasks.length})`}
              </h2>
              <button 
                onClick={handleSmartSort}
                disabled={isSorting || activeTasks.length < 2}
                className="text-fun-purple text-sm font-bold flex items-center gap-1 hover:bg-fun-purple/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSorting ? <span className="animate-spin">⌛</span> : <BrainCircuit size={16} />}
                AI Sort
              </button>
            </div>

            {activeTasks.length === 0 ? (
               <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Layout size={32} className="text-gray-300" />
                 </div>
                 <p className="text-gray-400 font-medium">
                   {searchQuery ? 'No tasks found matching your search.' : 'No active tasks. Time to relax or start something new!'}
                 </p>
               </div>
            ) : (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={activeTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {activeTasks.map(task => (
                      <SortableTaskItem 
                        key={task.id} 
                        task={task} 
                        onUpdateStatus={updateTaskStatus}
                        onDelete={(id) => setTaskToDelete(id)}
                        onEdit={(task) => {
                          setEditingTask(task);
                          setIsAddModalOpen(true);
                        }}
                        onToggleSubtask={toggleSubtask}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Enhanced History Section */}
            {doneTasks.length > 0 && (
              <div className="pt-2">
                <button 
                  onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                  className="w-full flex items-center justify-between p-4 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors group"
                >
                   <div className="flex items-center gap-2 font-bold text-gray-500 group-hover:text-gray-700">
                     <History size={20} />
                     <span>Task History ({doneTasks.length})</span>
                   </div>
                   {isHistoryExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </button>
                
                {isHistoryExpanded && (
                  <div className="mt-4 space-y-3 animate-in slide-in-from-top-2">
                    {doneTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onUpdateStatus={updateTaskStatus}
                        onDelete={(id) => setTaskToDelete(id)}
                        onEdit={(task) => {
                          setEditingTask(task);
                          setIsAddModalOpen(true);
                        }}
                        onToggleSubtask={toggleSubtask}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => {
            setEditingTask(null);
            setIsAddModalOpen(true);
          }}
          className="bg-gray-900 hover:bg-black text-white p-4 rounded-full shadow-xl shadow-gray-400/50 hover:scale-110 transition-transform duration-200 flex items-center justify-center"
        >
          <Plus size={28} />
        </button>
      </div>

      {isAddModalOpen && (
        <AddEditTaskModal 
          task={editingTask || undefined}
          existingCategories={categories}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
        />
      )}

      {showMorningPopup && (
        <MotivationalPopup 
          tasks={tasks.filter(t => t.status !== TaskStatus.DONE)} 
          userName="Champion"
          onClose={() => setShowMorningPopup(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white rounded-3xl p-6 shadow-xl max-w-sm w-full animate-in zoom-in-95">
              <h3 className="font-bold text-xl mb-2 text-gray-800">Delete Mission?</h3>
              <p className="text-gray-500 mb-6">Are you sure you want to delete this task? This action cannot be undone.</p>
              <div className="flex gap-3">
                 <button 
                   onClick={() => setTaskToDelete(null)}
                   className="flex-1 py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={confirmDeleteTask}
                   className="flex-1 py-3 font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-lg shadow-red-200"
                 >
                   Delete
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

export default App;