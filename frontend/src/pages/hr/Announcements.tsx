import React, { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { Megaphone, Calendar, User, Plus, PlusCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const Announcements: React.FC = () => {
  const { state, dispatch } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [audience, setAudience] = useState<any>('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/announcements');
        if (res.data.success) {
          setAnnouncements(res.data.data);
        }
      } catch (err) {
        toast.error("Failed to fetch announcements");
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this announcement? This will remove it permanently.")) return;
    
    const deleteToast = toast.loading("Deleting announcement...");
    try {
      const res = await api.delete(`/announcements/${id}`);
      if (res.data.success) {
        toast.success("Announcement deleted successfully!", { id: deleteToast });
        setAnnouncements(announcements.filter(ann => ann.id !== id));
      } else {
        toast.error(res.data.message || "Failed to delete announcement", { id: deleteToast });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting", { id: deleteToast });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error("Please enter a title and content.");
      return;
    }
    
    try {
      const res = await api.post('/announcements', {
        title,
        content,
        priority,
        audience
      });
      
      const data = res.data;
      
      if (data.success) {
        toast.success("New Announcement published successfully!");
        setAnnouncements([data.data, ...announcements]);
        setTitle('');
        setContent('');
        setShowAddForm(false);
      } else {
        toast.error(data.message || "Failed to publish announcement");
      }
    } catch (err) {
      toast.error("An error occurred while publishing");
    }
  };

  const getPriorityColor = (p: string) => {
    if (p === 'High') return 'bg-red-50 text-red-600 border border-red-100';
    if (p === 'Medium') return 'bg-amber-50 text-amber-600 border border-amber-100';
    return 'bg-slate-50 text-slate-500 border border-slate-100';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Announcements Bulletin" />

        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm md:text-base font-extrabold text-slate-800 tracking-tight">Active Broadcast Notices</h2>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" /> {showAddForm ? "View Bulletins" : "Create Broadcast"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Main Listing Panel */}
            <div className={`${showAddForm ? "lg:col-span-2" : "lg:col-span-3"} space-y-4 text-left`}>
              {loading ? (
                <div className="flex justify-center p-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : announcements.length > 0 ? (
                announcements.map((ann) => (
                  <div 
                    key={ann.id} 
                    className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 space-y-4"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getPriorityColor(ann.priority)}`}>
                          {ann.priority} Priority
                        </span>
                        <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-md">
                          To: {ann.audience}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(ann.createdAt).toISOString().split('T')[0]}</span>
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {ann.author}</span>
                        <button
                          onClick={() => handleDelete(ann.id)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Delete Announcement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-sm font-extrabold text-slate-800 tracking-tight leading-snug">{ann.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold">{ann.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 text-slate-400 space-y-2">
                  <Megaphone className="w-8 h-8 text-slate-300" />
                  <p className="text-xs font-bold">No announcements published</p>
                </div>
              )}
            </div>

            {/* Side creation panel */}
            {showAddForm && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                  <Megaphone className="w-4.5 h-4.5 text-indigo-600 animate-bounce" />
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Compose Broadcast</h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Notice Title *</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Daily Standup Timing Shift"
                      className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Detailed Content *</label>
                    <textarea 
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write instructions, links and critical details clearly..."
                      className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl h-28 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-base"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Priority</label>
                      <select 
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Audience</label>
                      <select 
                        value={audience}
                        onChange={(e) => setAudience(e.target.value as any)}
                        className="w-full text-xs font-medium px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                      >
                        <option value="All">All Cohorts</option>
                        <option value="Interns">Interns Only</option>
                        <option value="Mentors">Mentors Only</option>
                        <option value="Engineering">Engineering</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full px-4 py-3.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md cursor-pointer transition-all min-h-[44px]"
                  >
                    Broadcast Bulletin
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

