import React, { useState, useEffect } from 'react';
import { useTasks } from '../../hooks/queries';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  ClipboardCheck, Clock, FileText, CheckCircle, 
  MessageSquare, User, Send, Calendar, AlertCircle,
  Paperclip, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const TaskLifecycle: React.FC = () => {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Fetch Tasks
  const { data: allTasks = [], refetch: refetchTasks } = useTasks();
  const myTasks = allTasks.filter((t: any) => t.intern?.user?.id === user?.id || t.internId === (user as any)?.intern?.id);
  
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-select first task if none selected
  useEffect(() => {
    if (!selectedTask && myTasks.length > 0) {
      setSelectedTask(myTasks[0]);
    }
  }, [myTasks, selectedTask]);

  // Fetch comments when task changes
  useEffect(() => {
    const fetchComments = async () => {
      if (!selectedTask?.id) return;
      try {
        const res = await api.get(`/tasks/${selectedTask.id}/comments`);
        setComments(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch comments", error);
      }
    };
    fetchComments();
  }, [selectedTask]);

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() || !fileUrl.trim()) {
      toast.error("Please provide submission link and notes.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post(`/tasks/${selectedTask.id}/submit`, {
        submissionUrl: fileUrl,
        submissionNotes: notes,
      });
      toast.success("Task Submitted Successfully for Mentor Review!");
      setFileUrl('');
      setNotes('');
      await refetchTasks();
      
      // Update local selectedTask
      setSelectedTask((prev: any) => ({
        ...prev,
        status: 'REVIEW',
        submissionUrl: fileUrl,
        submissionNotes: notes,
        submittedAt: new Date().toISOString()
      }));
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to submit task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask?.id) return;
    try {
      const res = await api.post(`/tasks/${selectedTask.id}/comments`, {
        comment: newComment.trim()
      });
      setComments(prev => [...prev, res.data.data]);
      setNewComment('');
      toast.success("Feedback comment posted!");
    } catch (error) {
      toast.error("Failed to post comment.");
    }
  };

  const isSubmitted = selectedTask?.status === 'REVIEW' || selectedTask?.status === 'COMPLETED';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Task Deliverables & Feedback" />

        <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
          
          {/* Left Column: Task List */}
          <div className="w-full lg:w-1/3 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex-shrink-0">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-indigo-600" /> My Tasks
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {myTasks.length === 0 ? (
                <div className="text-center p-6 text-slate-400 text-xs font-semibold">No tasks assigned yet.</div>
              ) : (
                myTasks.map((t: any) => (
                  <div 
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                      selectedTask?.id === t.id 
                        ? 'bg-indigo-50 border-indigo-200 shadow-sm scale-[1.02]' 
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className={`font-extrabold text-xs line-clamp-1 ${selectedTask?.id === t.id ? 'text-indigo-900' : 'text-slate-700'}`}>{t.title}</h4>
                      <StatusBadge type="status" value={t.status} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due {new Date(t.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Task Specifications & Thread */}
          {selectedTask ? (
            <div className="flex-1 flex flex-col gap-6 max-h-[85vh]">
              
              {/* Task Details & Submission */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex-shrink-0">
                <div className="flex justify-between items-start flex-wrap gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="font-extrabold text-slate-800 text-base">{selectedTask.title}</h2>
                    <p className="text-xs text-slate-400 font-bold mt-1">Assigned by Mentor {selectedTask.mentor?.user?.name || 'Unknown'}</p>
                  </div>
                  <StatusBadge type="status" value={selectedTask.status} />
                </div>

                <div className="text-xs text-slate-600 font-semibold leading-relaxed space-y-3 mt-4">
                  <p>{selectedTask.description}</p>
                  <div className="grid grid-cols-2 gap-4 pt-3">
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <div>
                        <p className="font-bold text-[9px] text-slate-400">DUE DATE</p>
                        <p className="font-extrabold text-slate-700 text-[10px]">{new Date(selectedTask.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                      <AlertCircle className="w-4 h-4 text-indigo-600" />
                      <div>
                        <p className="font-bold text-[9px] text-slate-400">PRIORITY</p>
                        <StatusBadge type="priority" value={selectedTask.priority} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5 mt-5 space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-xs">Work Submission</h3>
                  
                  {isSubmitted ? (
                    <div className={`border rounded-2xl p-4 flex flex-col gap-3 ${selectedTask.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100' : 'bg-indigo-50 border-indigo-100'}`}>
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`w-5 h-5 flex-shrink-0 ${selectedTask.status === 'COMPLETED' ? 'text-emerald-600' : 'text-indigo-600'}`} />
                        <div className="text-xs">
                          <p className={`font-bold ${selectedTask.status === 'COMPLETED' ? 'text-emerald-800' : 'text-indigo-800'}`}>
                            {selectedTask.status === 'COMPLETED' ? 'Task Graded & Completed!' : 'Submission under Review'}
                          </p>
                          <p className={`text-[10px] font-semibold mt-0.5 ${selectedTask.status === 'COMPLETED' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                            {selectedTask.submittedAt ? `Submitted on ${new Date(selectedTask.submittedAt).toLocaleDateString()}` : ''}
                          </p>
                        </div>
                      </div>
                      
                      {selectedTask.submissionUrl && (
                        <a href={selectedTask.submissionUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-indigo-700 hover:underline flex items-center gap-1 bg-white/50 w-fit px-3 py-1.5 rounded-lg border border-indigo-100/50">
                          <Paperclip className="w-3.5 h-3.5" /> View Deliverable <ArrowRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleTaskSubmit} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Deliverable URL (GitHub/Doc)</label>
                        <input 
                          type="url"
                          required
                          value={fileUrl}
                          onChange={(e) => setFileUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Notes for the Reviewer</label>
                        <textarea 
                          rows={2} 
                          required
                          placeholder="Add comments or descriptions..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                        ></textarea>
                      </div>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Deliverables'}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Collaboration Thread (Comments) */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex-1 flex flex-col min-h-[250px]">
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 pb-3 border-b border-slate-100 flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-indigo-600" /> Mentor Feedback & Discussion
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-4 my-4 pr-1">
                  {comments.length === 0 ? (
                    <div className="text-center p-4 text-slate-400 text-xs font-semibold">No comments yet.</div>
                  ) : (
                    comments.map((c: any) => {
                      const isMe = c.userId === user?.id;
                      return (
                        <div key={c.id} className={`p-3 border rounded-2xl text-xs space-y-1 ${
                          isMe ? 'bg-indigo-50/20 border-indigo-100 ml-8' : 'bg-slate-50/50 border-slate-150 mr-8'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700">
                              {c.user?.name || 'User'} {isMe ? '(You)' : ''}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold">{new Date(c.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-[10px] text-slate-600 leading-relaxed font-medium">{c.comment}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex gap-2 items-center pt-3 border-t border-slate-100 flex-shrink-0">
                  <input 
                    type="text" 
                    placeholder="Ask your mentor a question..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    className="flex-1 text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white" 
                  />
                  <button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center p-6 text-slate-400 text-sm font-semibold">
              Select a task from the list to view its details and feedback.
            </div>
          )}

        </div>
      </main>
    </div>
  );
};
