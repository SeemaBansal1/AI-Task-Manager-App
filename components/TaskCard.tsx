import React from 'react';
import { Calendar, MessageCircle, CheckCircle, Clock, Trash2, Hourglass, Pencil, Link as LinkIcon, Bell, ExternalLink, CheckSquare, Square, Check, GripVertical, RotateCcw } from 'lucide-react';
import { Task, TaskStatus, Priority, ReminderMethod } from '../types';

interface Props {
  task: Task;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  dragHandleProps?: any;
  isDragging?: boolean;
}

const TaskCard: React.FC<Props> = ({ task, onUpdateStatus, onDelete, onEdit, onToggleSubtask, dragHandleProps, isDragging }) => {
  
  const getPriorityColor = (p: Priority) => {
    switch(p) {
      case Priority.HIGH: return 'bg-red-100 text-red-700 border-red-200';
      case Priority.MEDIUM: return 'bg-orange-100 text-orange-700 border-orange-200';
      case Priority.LOW: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getStatusIcon = () => {
    switch(task.status) {
      case TaskStatus.DONE: return <CheckCircle className="text-green-500" />;
      case TaskStatus.AWAITING_RESULT: return <Hourglass className="text-amber-500" />;
      default: return <Clock className="text-gray-400" />;
    }
  };

  const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(task.title)}&details=${encodeURIComponent(task.description || '')}&dates=${task.deadline.replace(/-|:/g, '')}/${task.deadline.replace(/-|:/g, '')}`;
  
  let reminderActionUrl = '';
  
  if (task.reminder) {
      if (task.reminder.method === ReminderMethod.CALENDAR) {
          reminderActionUrl = googleCalendarLink; 
      } else if (task.reminder.method === ReminderMethod.WHATSAPP) {
          reminderActionUrl = `https://wa.me/?text=${encodeURIComponent(`Reminder for ${task.title} at ${new Date(task.reminder.dateTime).toLocaleString()}`)}`;
      }
  }

  const completedSubtasks = (task.subtasks || []).filter(s => s.completed).length;
  const totalSubtasks = (task.subtasks || []).length;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div className={`group bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col gap-4 relative
      ${task.status === TaskStatus.DONE ? 'opacity-75 bg-gray-50' : ''}
      ${isDragging ? 'shadow-2xl scale-[1.02] rotate-1 z-50 ring-2 ring-fun-purple/20' : ''}
    `}>
      
      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
        <div className="flex items-start gap-4 flex-1 w-full">
            {/* Drag Handle - Only for active tasks */}
            {dragHandleProps && task.status !== TaskStatus.DONE && (
              <div 
                {...dragHandleProps} 
                className="pt-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
              >
                <GripVertical size={20} />
              </div>
            )}
            
            <div className="pt-1">
            <button 
                onClick={() => {
                  const nextStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
                  onUpdateStatus(task.id, nextStatus);
                }}
                className="hover:scale-110 transition-transform"
                title={task.status === TaskStatus.DONE ? "Mark as Todo" : "Mark as Done"}
            >
                {getStatusIcon()}
            </button>
            </div>
            
            <div className="w-full">
            <div className="flex justify-between items-start w-full">
                 <h3 className={`font-bold text-gray-800 text-lg ${task.status === TaskStatus.DONE ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                </h3>
            </div>
            
             {/* Links Display */}
             {task.links && task.links.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 mb-2">
                      {task.links.map((link, idx) => (
                          <a 
                             key={idx} 
                             href={link.url} 
                             target="_blank" 
                             rel="noreferrer"
                             className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-md hover:bg-blue-100 transition-colors border border-blue-100 z-10 relative"
                             onClick={(e) => e.stopPropagation()} 
                          >
                              <LinkIcon size={12} />
                              {link.title}
                              <ExternalLink size={10} className="opacity-50" />
                          </a>
                      ))}
                  </div>
              )}

            {task.description && <p className="text-gray-500 text-sm mt-1">{task.description}</p>}
            
            <div className="flex flex-wrap gap-2 mt-3 items-center">
                <span className={`text-xs px-2 py-1 rounded-lg font-bold border ${getPriorityColor(task.priority)}`}>
                {task.priority}
                </span>
                <span className="text-xs px-2 py-1 rounded-lg font-bold border bg-gray-100 text-gray-700 border-gray-200">
                  {task.category}
                </span>
                <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200">
                Due: {new Date(task.deadline).toLocaleDateString()}
                </span>
                
                {task.reminder && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200">
                        <Bell size={12} /> {new Date(task.reminder.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                )}
            </div>
            </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end self-end md:self-start">
            {task.status === TaskStatus.DONE ? (
              // Restore Button for Completed Tasks
              <button 
                  onClick={() => onUpdateStatus(task.id, TaskStatus.TODO)}
                  title="Restore Task"
                  className="p-2 bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-600 rounded-xl transition-colors flex items-center gap-1 font-bold text-xs"
              >
                  <RotateCcw size={16} /> Restore
              </button>
            ) : (
            <>
                <button 
                    onClick={() => onUpdateStatus(task.id, task.status === TaskStatus.AWAITING_RESULT ? TaskStatus.TODO : TaskStatus.AWAITING_RESULT)}
                    title="Toggle Awaiting Result"
                    className={`p-2 rounded-xl transition-colors ${task.status === TaskStatus.AWAITING_RESULT ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400 hover:bg-amber-50 hover:text-amber-500'}`}
                >
                    <Hourglass size={18} />
                </button>

                <button 
                onClick={() => onEdit(task)}
                title="Edit Task"
                className="p-2 bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition-colors"
                >
                <Pencil size={18} />
                </button>

                {/* Explicit Done Button */}
                <button
                  onClick={() => onUpdateStatus(task.id, TaskStatus.DONE)}
                  title="Mark as Done"
                  className="p-2 bg-green-50 text-green-500 hover:bg-green-100 hover:text-green-600 rounded-xl transition-colors"
                >
                  <Check size={18} />
                </button>
            </>
            )}
            
            <button 
              onClick={() => onDelete(task.id)} 
              title="Delete Task"
              className="p-2 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"
            >
              <Trash2 size={18} />
            </button>
        </div>
      </div>

      {/* Subtasks Display */}
      {task.subtasks && task.subtasks.length > 0 && (
          <div className="border-t border-gray-100 pt-3 mt-1 space-y-3">
              <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <span>Progress ({Math.round(progress)}%)</span>
                      <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-fun-teal transition-all duration-500" style={{ width: `${progress}%` }}></div>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                      {task.subtasks.map(st => (
                          <button
                            key={st.id}
                            onClick={() => onToggleSubtask(task.id, st.id)}
                            className={`flex items-center gap-2.5 text-sm p-1.5 rounded-lg hover:bg-gray-50 text-left transition-colors ${st.completed ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-700'}`}
                          >
                              {st.completed ? (
                                  <CheckSquare size={16} className="text-fun-teal shrink-0" />
                              ) : (
                                  <Square size={16} className="text-gray-300 shrink-0" />
                              )}
                              <span className="truncate">{st.title}</span>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Specific Reminder Action if exists */}
      {task.reminder && task.reminder.method !== ReminderMethod.NOTIFICATION && task.status !== TaskStatus.DONE && (
          <div className="bg-orange-50 rounded-lg p-2.5 flex items-center justify-between text-xs text-orange-800">
             <div className="flex items-center gap-2">
                <Bell size={14} className="text-orange-500" />
                <span>Scheduled: {new Date(task.reminder.dateTime).toLocaleString()}</span>
             </div>
             <a href={reminderActionUrl} target="_blank" rel="noreferrer" className="font-bold underline hover:text-orange-600">
                 {task.reminder.method === ReminderMethod.WHATSAPP ? 'Open WhatsApp' : 'Open Calendar'}
             </a>
          </div>
      )}

    </div>
  );
};

export default TaskCard;