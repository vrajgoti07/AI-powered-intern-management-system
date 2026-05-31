import React, { useState } from 'react';
import { useTasks, useInterns } from '../../hooks/queries';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { TaskForm } from '../../components/forms/TaskForm';
import { Plus, FileText, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export const TaskManagement: React.FC = () => {
  const { user } = useAuth();
  const { data: tasks = [], isLoading: isTasksLoading, refetch: refreshTasks } = useTasks();
  const isMentor = user?.role === 'mentor';
  const resolvedDeptId = (user as any)?.mentor?.departmentId || (user as any)?.headedDepartment?.id;
  const { data: interns = [] } = useInterns(
    isMentor && resolvedDeptId
      ? { departmentId: resolvedDeptId }
      : undefined
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Group tasks by status
  const columns: { title: string; status: any; color: string }[] = [
    { title: "To Do", status: "TODO", color: "border-t-slate-400 bg-slate-50/50" },
    { title: "In Progress", status: "IN_PROGRESS", color: "border-t-blue-400 bg-blue-50/20" },
    { title: "In Review", status: "REVIEW", color: "border-t-purple-400 bg-purple-50/20" },
    { title: "Completed", status: "COMPLETED", color: "border-t-emerald-400 bg-emerald-50/20" },
  ];

  const handleCreateTask = async (taskData: any) => {
    try {
      await api.post('/tasks', {
        title: taskData.title,
        description: taskData.description,
        internId: taskData.internId,
        priority: taskData.priority.toUpperCase(),
        dueDate: new Date(taskData.dueDate).toISOString()
      });
      toast.success("New task created and assigned successfully!");
      setShowAddModal(false);
      await refreshTasks();
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to create task";
      toast.error(errMsg);
    }
  };

  const handleUpdateStatus = async (id: string, status: any) => {
    try {
      const mappedStatus = status === 'In Progress' ? 'IN_PROGRESS' : status.toUpperCase();
      await api.put(`/tasks/${id}`, { status: mappedStatus });
      toast.success(`Task status updated to ${status}`);
      setSelectedTask(null);
      await refreshTasks();
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to update task status";
      toast.error(errMsg);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      if (!window.confirm("Are you sure you want to delete this task milestone?")) return;
      await api.delete(`/tasks/${id}`);
      toast.success("Task deleted successfully!");
      setSelectedTask(null);
      await refreshTasks();
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to delete task";
      toast.error(errMsg);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Task Boards (Kanban)" />

        {/* Board actions */}
        <div className="p-6 pb-0 text-left">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4" /> Create & Assign Task
          </button>
        </div>

        {/* Kanban Board Container */}
        <div className="flex-1 p-6 overflow-x-auto overflow-y-hidden flex gap-5 items-stretch select-none">
          {columns.map((col) => {
            const colTasks = tasks.filter((t: any) => t.status === col.status);
            return (
              <div 
                key={col.title} 
                className="w-72 bg-white rounded-3xl p-4 border border-slate-100 flex flex-col flex-shrink-0"
              >
                {/* Column header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 flex-shrink-0">
                  <h3 className="font-extrabold text-slate-800 text-xs tracking-tight flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      col.status === 'Completed' ? 'bg-emerald-500' : col.status === 'Review' ? 'bg-purple-500' : col.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-400'
                    }`} />
                    {col.title}
                  </h3>
                  <span className="text-[10px] bg-slate-50 text-slate-500 font-bold px-2 py-0.5 border border-slate-100 rounded-md">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column content */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 flex flex-col justify-start">
                  {isTasksLoading ? (
                    <div className="space-y-3 animate-pulse">
                      {[1, 2].map((n) => (
                        <div key={n} className="bg-slate-50 p-4 border border-slate-200/50 rounded-2xl space-y-3 h-28 flex flex-col justify-between">
                          <div className="flex justify-between items-center">
                            <div className="h-3 w-2/3 bg-slate-200 rounded"></div>
                            <div className="h-4 w-12 bg-slate-200 rounded"></div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="h-2 w-full bg-slate-200 rounded"></div>
                            <div className="h-2 w-5/6 bg-slate-200 rounded"></div>
                          </div>
                          <div className="h-2.5 w-1/3 bg-slate-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : colTasks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200/60 rounded-3xl p-4 text-center text-slate-350 min-h-[140px] bg-slate-50/20">
                      <span className="text-[10px] text-slate-400 font-bold">No tasks here</span>
                    </div>
                  ) : (
                    colTasks.map((t: any) => (
                      <div 
                        key={t.id} 
                        onClick={() => setSelectedTask(t)}
                        className="bg-slate-50 hover:bg-slate-100/50 p-4 border border-slate-200/50 rounded-2xl text-left cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 space-y-3 shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-extrabold text-slate-800 text-xs leading-snug line-clamp-2">{t.title}</span>
                          <StatusBadge type="priority" value={t.priority} />
                        </div>
                        
                        <p className="text-[10px] text-slate-400 font-semibold line-clamp-2 leading-relaxed">{t.description}</p>
                        
                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/40 text-[9px] text-slate-400 font-bold">
                          <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                          <span className="text-indigo-600 truncate max-w-[80px]">@{t.intern?.user?.name?.split(' ')[0] || "Unknown"}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Task Milestone">
        <TaskForm 
          interns={interns}
          onSubmit={handleCreateTask}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* 2. Task Details Inspect */}
      <Modal isOpen={selectedTask !== null} onClose={() => setSelectedTask(null)} title="Task Evaluation Card">
        {selectedTask && (
          <div className="space-y-5 text-left text-xs font-semibold text-slate-600">
            <div className="pb-3 border-b border-slate-100">
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">{selectedTask.title}</h4>
                <StatusBadge type="priority" value={selectedTask.priority} />
              </div>
              <p className="text-[10px] text-slate-400 font-bold">Assignee: {selectedTask.intern?.user?.name || "Unknown"} · Supervisor: {selectedTask.mentor?.user?.name || "Unknown"}</p>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-400 font-bold">Milestone Description:</span>
              <p className="leading-relaxed text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-200/50">{selectedTask.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-slate-400 font-bold block mb-0.5">Due Date:</span>{new Date(selectedTask.dueDate).toLocaleDateString()}</div>
              <div><span className="text-slate-400 font-bold block mb-0.5">Current Status:</span><StatusBadge type="status" value={selectedTask.status} /></div>
            </div>

            {/* Submission Section */}
            {selectedTask.submissionUrl && (
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between text-indigo-800">
                  <span className="font-extrabold flex items-center gap-1.5"><FileText className="w-4 h-4 animate-bounce" /> Intern Submission</span>
                  <span className="text-[9px] font-bold">{selectedTask.submittedAt ? new Date(selectedTask.submittedAt).toLocaleDateString() : ''}</span>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-700/80 font-bold block">Submission Link / File:</span>
                  <a 
                    href={selectedTask.submissionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1 mt-1"
                  >
                    {selectedTask.submissionUrl} <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
                {selectedTask.submissionNotes && (
                  <div>
                    <span className="text-[10px] text-indigo-700/80 font-bold block">Submission Notes:</span>
                    <p className="text-[10px] text-indigo-900 leading-relaxed font-semibold italic mt-0.5">"{selectedTask.submissionNotes}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions for Mentors */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                onClick={() => handleDeleteTask(selectedTask.id)}
                className="px-4 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer mr-auto min-h-[44px]"
              >
                Delete Task
              </button>
              
              <button 
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Close details
              </button>
              
              {selectedTask.status === 'REVIEW' && (
                <>
                  <button 
                    onClick={() => handleUpdateStatus(selectedTask.id, 'In Progress')}
                    className="px-4 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer min-h-[44px]"
                  >
                    Reject Submission
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedTask.id, 'Completed')}
                    className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md cursor-pointer min-h-[44px]"
                  >
                    Approve Submission
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};
