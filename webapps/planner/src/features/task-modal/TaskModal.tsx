import React, { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { X, CheckSquare, AlignLeft, MessageSquare, Clock, Trash2, Save } from 'lucide-react';
import clsx from 'clsx';
import type { Task } from '../../db/db';

export function TaskModal() {
    const {
        selectedTaskId, setSelectedTask, tasks, updateTask, deleteTask,
        checklistItems, addChecklistItem, updateChecklistItem, deleteChecklistItem,
        notes, addNote, deleteNote, buckets
    } = usePlannerStore();

    const [newChecklistTitle, setNewChecklistTitle] = useState('');
    const [newNoteText, setNewNoteText] = useState('');
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [descEditValue, setDescEditValue] = useState('');

    const task = tasks.find(t => t.id === selectedTaskId);

    if (!task || !selectedTaskId) return null;

    const bucketName = buckets.find(b => b.id === task.bucketId)?.title || 'Unknown';
    const taskChecklist = checklistItems.filter(c => c.taskId === task.id);
    const taskNotes = notes.filter(n => n.taskId === task.id).sort((a, b) => b.timestamp - a.timestamp);

    const completedChecklistCount = taskChecklist.filter(c => c.isCompleted).length;
    const checklistProgress = taskChecklist.length > 0 ? Math.round((completedChecklistCount / taskChecklist.length) * 100) : 0;

    const handleClose = () => setSelectedTask(null);

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this task?')) {
            deleteTask(task.id);
            handleClose();
        }
    };

    const handleDescSave = () => {
        updateTask(task.id, { description: descEditValue });
        setIsEditingDesc(false);
    };

    const startDescEdit = () => {
        setDescEditValue(task.description || '');
        setIsEditingDesc(true);
    };

    const handleAddChecklist = (e: React.FormEvent) => {
        e.preventDefault();
        if (newChecklistTitle.trim()) {
            addChecklistItem(task.id, newChecklistTitle.trim());
            setNewChecklistTitle('');
        }
    };

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (newNoteText.trim()) {
            addNote(task.id, newNoteText.trim());
            setNewNoteText('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-full flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex flex-col">
                        <input
                            type="text"
                            value={task.title}
                            onChange={(e) => updateTask(task.id, { title: e.target.value })}
                            className="text-xl font-bold text-gray-900 bg-transparent border-none p-0 outline-none focus:ring-0 placeholder-gray-400 min-w-[300px]"
                            placeholder="Task Title"
                        />
                        <span className="text-xs font-medium text-gray-500 mt-1">in bucket <span className="underline decoration-gray-300">{bucketName}</span></span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleClose} className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Save Task">
                            <Save size={18} />
                        </button>
                        <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Delete Task">
                            <Trash2 size={18} />
                        </button>
                        <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors" title="Close">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6 md:flex md:gap-8 custom-scrollbar">

                    {/* Main Column */}
                    <div className="flex-1 space-y-8 min-w-0">

                        {/* Description */}
                        <section>
                            <div className="flex items-center space-x-3 mb-3 text-gray-700">
                                <AlignLeft size={18} />
                                <h3 className="font-semibold text-sm tracking-wide">Description</h3>
                            </div>
                            {isEditingDesc ? (
                                <div className="space-y-2">
                                    <textarea
                                        autoFocus
                                        value={descEditValue}
                                        onChange={(e) => setDescEditValue(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[120px] resize-y text-gray-800"
                                        placeholder="Add a more detailed description..."
                                    />
                                    <div className="flex items-center space-x-2">
                                        <button onClick={handleDescSave} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors">Save</button>
                                        <button onClick={() => setIsEditingDesc(false)} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={startDescEdit}
                                    className="bg-gray-50 hover:bg-gray-100 p-3 rounded-lg text-sm text-gray-700 min-h-[80px] cursor-text transition-colors border border-transparent hover:border-gray-200"
                                >
                                    {task.description ? (
                                        <p className="whitespace-pre-wrap">{task.description}</p>
                                    ) : (
                                        <p className="text-gray-400">Add a more detailed description...</p>
                                    )}
                                </div>
                            )}
                        </section>

                        {/* Checklist */}
                        <section>
                            <div className="flex items-center space-x-3 mb-3 text-gray-700">
                                <CheckSquare size={18} />
                                <h3 className="font-semibold text-sm tracking-wide">Checklist</h3>
                            </div>

                            {taskChecklist.length > 0 && (
                                <div className="mb-4 flex items-center space-x-3">
                                    <span className="text-xs font-semibold text-gray-500 w-8">{checklistProgress}%</span>
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={clsx("h-full transition-all duration-300", checklistProgress === 100 ? "bg-green-500" : "bg-blue-500")}
                                            style={{ width: `${checklistProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 mb-3">
                                {taskChecklist.map(item => (
                                    <div key={item.id} className="flex items-start group">
                                        <input
                                            type="checkbox"
                                            checked={item.isCompleted}
                                            onChange={(e) => updateChecklistItem(item.id, { isCompleted: e.target.checked })}
                                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={item.title}
                                            onChange={(e) => updateChecklistItem(item.id, { title: e.target.value })}
                                            className={clsx(
                                                "ml-3 flex-1 bg-transparent border-transparent py-0.5 text-sm focus:ring-0 focus:border-b-blue-500 transition-all",
                                                item.isCompleted ? "text-gray-400 line-through" : "text-gray-700 hover:bg-gray-50"
                                            )}
                                        />
                                        <button
                                            onClick={() => deleteChecklistItem(item.id)}
                                            className="ml-2 p-1 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all rounded"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleAddChecklist}>
                                <button type="submit" className="hidden" />
                                <input
                                    type="text"
                                    value={newChecklistTitle}
                                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                                    placeholder="Add an item"
                                    className="w-full text-sm bg-transparent border border-gray-200 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 transition-all placeholder-gray-400"
                                />
                            </form>
                        </section>

                    </div>

                    {/* Sidebar / Metadata Column */}
                    <div className="md:w-64 mt-8 md:mt-0 flex-shrink-0 space-y-6">

                        {/* Status & Priority */}
                        <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Status</label>
                                <select
                                    value={task.status}
                                    onChange={(e) => updateTask(task.id, { status: e.target.value as Task['status'] })}
                                    className="w-full text-sm bg-white border border-gray-200 rounded-md p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                                >
                                    <option value="Not Started">Not Started</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Priority</label>
                                <select
                                    value={task.priority}
                                    onChange={(e) => updateTask(task.id, { priority: e.target.value as Task['priority'] })}
                                    className="w-full text-sm bg-white border border-gray-200 rounded-md p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                                >
                                    <option value="Urgent">Urgent</option>
                                    <option value="Important">Important</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center">
                                    <Clock size={12} className="mr-1" /> Due Date
                                </label>
                                <div className="flex flex-col space-y-2">
                                    <input
                                        type="date"
                                        value={
                                            task.dueDate
                                                ? (() => {
                                                    const d = new Date(task.dueDate);
                                                    const year = d.getFullYear();
                                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                                    const day = String(d.getDate()).padStart(2, '0');
                                                    return `${year.toString().padStart(4, '0')}-${month}-${day}`;
                                                })()
                                                : ''
                                        }
                                        onChange={(e) => {
                                            const dateStr = e.target.value;
                                            if (!dateStr) {
                                                updateTask(task.id, { dueDate: undefined });
                                                return;
                                            }
                                            const newDate = new Date(dateStr);
                                            // Handle potential "invalid date" if they are midway typing
                                            if (isNaN(newDate.getTime())) return;

                                            // Preserve existing time if any
                                            if (task.dueDate) {
                                                const existingDate = new Date(task.dueDate);
                                                newDate.setHours(existingDate.getHours());
                                                newDate.setMinutes(existingDate.getMinutes());
                                                newDate.setSeconds(existingDate.getSeconds());
                                            }
                                            updateTask(task.id, { dueDate: newDate.getTime() });
                                        }}
                                        className="w-full text-sm bg-white border border-gray-200 rounded-md p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                                    />
                                    <input
                                        type="time"
                                        value={
                                            task.dueDate
                                                ? (() => {
                                                    const d = new Date(task.dueDate);
                                                    const hours = String(d.getHours()).padStart(2, '0');
                                                    const minutes = String(d.getMinutes()).padStart(2, '0');
                                                    return `${hours}:${minutes}`;
                                                })()
                                                : ''
                                        }
                                        onChange={(e) => {
                                            const timeStr = e.target.value;
                                            const baseDate = task.dueDate ? new Date(task.dueDate) : new Date();

                                            if (!timeStr) {
                                                // If they clear the time, default back to midnight of whatever day it is
                                                baseDate.setHours(0, 0, 0, 0);
                                                updateTask(task.id, { dueDate: baseDate.getTime() });
                                                return;
                                            }

                                            const [hours, minutes] = timeStr.split(':').map(Number);
                                            baseDate.setHours(hours, minutes, 0, 0);
                                            updateTask(task.id, { dueDate: baseDate.getTime() });
                                        }}
                                        className="w-full text-sm bg-white border border-gray-200 rounded-md p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex items-center space-x-2 text-gray-700 mb-3 block">
                                <MessageSquare size={16} />
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notes</h3>
                            </div>

                            <form onSubmit={handleAddNote} className="mb-4">
                                <textarea
                                    value={newNoteText}
                                    onChange={(e) => setNewNoteText(e.target.value)}
                                    placeholder="Write a note..."
                                    className="w-full text-sm bg-white border border-gray-200 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20 text-gray-800 placeholder-gray-400"
                                />
                                <div className="flex justify-end mt-2">
                                    <button type="submit" disabled={!newNoteText.trim()} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium text-xs rounded transition-colors disabled:opacity-50">
                                        Add Note
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                {taskNotes.map(note => (
                                    <div key={note.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm relative group">
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-snug">{note.text}</p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-[10px] font-medium text-gray-400">{new Date(note.timestamp).toLocaleString()}</span>
                                            <button onClick={() => deleteNote(note.id)} className="text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                    </div>
                </div>

            </div>
        </div>
    );
}
