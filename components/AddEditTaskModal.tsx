import React, { useState } from 'react';
import { X, Calendar, Briefcase, Heart, CheckSquare, Link as LinkIcon, Bell, Plus, Tag, ChevronDown } from 'lucide-react';
import { Task, Priority, Subtask, LinkAttachment, Reminder, ReminderMethod } from '../types';

interface Props {
  task?: Task;
  existingCategories: string[];
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
}

const AddEditTaskModal: React.FC<Props> = ({ task, existingCategories, onClose, onSave }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [deadline, setDeadline] = useState(task?.deadline || new Date().toISOString().split('T')[0]);
  
  // Category State
  const [category, setCategory] = useState<string>(task?.category || 'Professional');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const [priority, setPriority] = useState<Priority>(task?.priority || Priority.MEDIUM);
  
  // Subtasks
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  // Links
  const [links, setLinks] = useState<LinkAttachment[]>(task?.links || []);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');

  // Reminder
  const [hasReminder, setHasReminder] = useState(!!task?.reminder);
  const [reminderDateTime, setReminderDateTime] = useState(task?.reminder?.dateTime || '');
  const [reminderMethod, setReminderMethod] = useState<ReminderMethod>(task?.reminder?.method || ReminderMethod.NOTIFICATION);

  const today = new Date().toISOString().split('T')[0];

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([...subtasks, { id: Date.now().toString() + Math.random().toString().slice(2), title: newSubtaskTitle, completed: false }]);
    setNewSubtaskTitle('');
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;
    // Simple URL validation prefix
    let url = newLinkUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;

    setLinks([...links, { url, title: newLinkTitle || url }]);
    setNewLinkUrl('');
    setNewLinkTitle('');
  };

  const removeLink = (url: string) => {
    setLinks(links.filter(l => l.url !== url));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    const finalCategory = isCustomCategory && customCategoryInput.trim() ? customCategoryInput.trim() : category;

    const reminder: Reminder | undefined = hasReminder && reminderDateTime ? {
      dateTime: reminderDateTime,
      method: reminderMethod,
      notified: false
    } : undefined;

    onSave({
      title,
      description,
      deadline,
      category: finalCategory,
      priority,
      subtasks,
      links,
      reminder
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
          
          <div className="flex items-center justify-between p-6 border-b border-gray-100 rounded-t-3xl bg-white">
            <h2 className="text-xl font-display font-bold text-gray-800">
              {task ? 'Edit Mission 📝' : 'New Mission 🎯'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Main Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Task Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Finish Project Report"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-fun-purple focus:ring-2 focus:ring-fun-purple/20 outline-none transition-all"
                  autoFocus
                />
              </div>
              
               <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Deadline</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="date"
                      value={deadline}
                      min={today}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-fun-purple focus:ring-2 focus:ring-fun-purple/20 outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-fun-purple focus:ring-2 focus:ring-fun-purple/20 outline-none bg-white"
                  >
                    <option value={Priority.HIGH}>High 🔥</option>
                    <option value={Priority.MEDIUM}>Medium ⚡</option>
                    <option value={Priority.LOW}>Low ☕</option>
                  </select>
                </div>
              </div>

               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                 <div className="space-y-2">
                   {!isCustomCategory ? (
                     <div className="flex gap-2">
                       <div className="relative flex-1">
                          <Tag size={18} className="absolute left-3 top-3.5 text-gray-400" />
                          <select
                            value={category}
                            onChange={(e) => {
                              if (e.target.value === 'custom_plus') {
                                setIsCustomCategory(true);
                                setCustomCategoryInput('');
                              } else {
                                setCategory(e.target.value);
                              }
                            }}
                            className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:border-fun-purple focus:ring-2 focus:ring-fun-purple/20 outline-none bg-white appearance-none"
                          >
                            {existingCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="custom_plus">+ Create New Category</option>
                          </select>
                          <ChevronDown size={18} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                       </div>
                     </div>
                   ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customCategoryInput}
                          onChange={(e) => setCustomCategoryInput(e.target.value)}
                          placeholder="Enter new category name..."
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-fun-purple focus:ring-2 focus:ring-fun-purple/20 outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setIsCustomCategory(false)}
                          className="px-4 py-2 text-gray-500 hover:text-gray-700 font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                   )}
                 </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Details (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-fun-purple focus:ring-2 focus:ring-fun-purple/20 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Links Section - Enhanced Input */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                <LinkIcon size={16} /> Links
              </label>
               <div className="space-y-2">
                {links.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg group border border-blue-100">
                     <LinkIcon size={12} className="text-blue-400" />
                     <a href={link.url} target="_blank" rel="noreferrer" className="flex-1 text-sm text-blue-700 truncate hover:underline">{link.title}</a>
                     <button type="button" onClick={() => removeLink(link.url)} className="text-blue-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                       <X size={16} />
                     </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    placeholder="Link Title (e.g. Doc)"
                    className="w-1/3 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-fun-purple outline-none"
                  />
                  <input
                    type="text"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-fun-purple outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddLink}
                    disabled={!newLinkUrl.trim()}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Subtasks Section */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                <CheckSquare size={16} /> Subtasks
              </label>
              <div className="space-y-2">
                {subtasks.map(st => (
                  <div key={st.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg group">
                     <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                     <span className="flex-1 text-sm text-gray-700 truncate">{st.title}</span>
                     <button type="button" onClick={() => removeSubtask(st.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                       <X size={16} />
                     </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                    placeholder="Add a step..."
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-fun-purple focus:ring-2 focus:ring-fun-purple/20 outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Reminder Section */}
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
               <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-orange-800">
                    <Bell size={16} /> Custom Reminder
                  </label>
                  <button 
                    type="button"
                    onClick={() => setHasReminder(!hasReminder)}
                    className={`relative w-11 h-6 transition-colors rounded-full ${hasReminder ? 'bg-orange-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${hasReminder ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
               </div>
               
               {hasReminder && (
                 <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                   <div>
                     <label className="block text-xs font-bold text-orange-700 mb-1">When?</label>
                     <input 
                        type="datetime-local"
                        value={reminderDateTime}
                        onChange={(e) => setReminderDateTime(e.target.value)}
                        className="w-full text-sm px-2 py-2 rounded-lg border border-orange-200 bg-white focus:outline-none focus:border-orange-500"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-orange-700 mb-1">How?</label>
                     <select
                        value={reminderMethod}
                        onChange={(e) => setReminderMethod(e.target.value as ReminderMethod)}
                        className="w-full text-sm px-2 py-2 rounded-lg border border-orange-200 bg-white focus:outline-none focus:border-orange-500"
                     >
                       <option value={ReminderMethod.NOTIFICATION}>Popup / Browser</option>
                       <option value={ReminderMethod.WHATSAPP}>WhatsApp Link</option>
                       <option value={ReminderMethod.CALENDAR}>Calendar Link</option>
                     </select>
                   </div>
                 </div>
               )}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-fun-purple to-fun-pink hover:from-violet-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-pink-200 transition-all transform hover:-translate-y-1 active:translate-y-0"
            >
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditTaskModal;