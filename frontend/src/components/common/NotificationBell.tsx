import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Pagination } from '../Pagination';
import { useAuth } from '../../hooks/useAuth';
import { useNotificationStore, Notification } from '../../store/useNotificationStore';
import { useInternByUser } from '../../hooks/queries';
import { useDigestStore } from '../../store/useDigestStore';

export const NotificationBell: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: myInternData } = useInternByUser(user?.id || '');
  const mentorName = myInternData?.mentor?.user?.name || '';

  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const totalPages = Math.ceil(unreadNotifications.length / itemsPerPage);
  const paginatedNotifications = unreadNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [showNotifications, unreadNotifications.length]);

  const handleMarkAllAsRead = async () => {
    if (unreadCount > 0) {
      await markAllAsRead();
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      await markAsRead(n.id);
    }
    
    setShowNotifications(false);
    
    const type = (n.type || '').toUpperCase();
    const role = user?.role?.toLowerCase() || '';
    
    if (type === 'TASK') {
      if (role === 'intern') {
        navigate('/intern/tasks');
      } else if (role === 'mentor') {
        navigate('/mentor/tasks');
      } else if (role === 'hr' || role === 'super_admin') {
        navigate('/hr/dashboard');
      }
    } else if (type === 'LEAVE') {
      navigate('/shared/attendance-leave');
    } else if (type === 'ANNOUNCEMENT') {
      if (role === 'hr' || role === 'super_admin') {
        navigate('/hr/announcements');
      } else {
        navigate('/intern/dashboard');
      }
    } else if (type === 'CHAT') {
      navigate('/shared/communication');
    } else if (type === 'APPLICATION') {
      if (role === 'hr' || role === 'admin' || role === 'super_admin') {
        navigate('/hr/interns');
      }
    } else if (type === 'DIGEST') {
      if (n.data) {
        useDigestStore.getState().openDigest(n.data as any);
      }
    }
  };

  const getSpecificNotificationType = (n: Notification) => {
    const title = (n.title || '').toLowerCase();
    const type = (n.type || '').toUpperCase();

    if (type === 'TASK') {
      if (title.includes('submitted')) return 'Submission';
      if (title.includes('comment')) return 'Task Comment';
      if (title.includes('assigned') || title.includes('assign')) return 'New Task';
      return 'Task';
    }
    if (type === 'LEAVE') {
      if (title.includes('approved')) return 'Leave Approved';
      if (title.includes('rejected')) return 'Leave Rejected';
      return 'Leave Request';
    }
    if (type === 'CHAT') {
      return 'Chat Message';
    }
    if (type === 'ANNOUNCEMENT') {
      return 'Announcement';
    }
    if (type === 'APPLICATION') {
      return 'New Application';
    }
    if (type === 'DIGEST') {
      return 'Weekly Digest';
    }
    return n.type || 'System';
  };

  const getNotificationColorClass = (specificType: string) => {
    const t = specificType.toLowerCase();
    if (t.includes('submission')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (t.includes('comment')) return 'text-purple-600 bg-purple-50 border-purple-100';
    if (t.includes('task') || t.includes('new')) return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    if (t.includes('leave')) return 'text-amber-600 bg-amber-50 border-amber-100';
    if (t.includes('chat')) return 'text-blue-600 bg-blue-50 border-blue-100';
    if (t.includes('application') || t.includes('new application')) {
      return 'text-rose-600 bg-rose-50 border-rose-100';
    }
    if (t.includes('digest') || t.includes('weekly')) {
      return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    }
    return 'text-slate-500 bg-slate-50 border-slate-100';
  };

  const getFormattedNotificationTitle = (n: Notification) => {
    let title = n.title || 'Notification';
    
    if (n.type === 'CHAT' && mentorName) {
      const cleanMentor = mentorName.toLowerCase();
      const titleLower = title.toLowerCase();
      
      if (!title.includes('(Mentor)')) {
        if (titleLower.includes(cleanMentor)) {
          const matchIdx = titleLower.indexOf(cleanMentor);
          if (matchIdx !== -1) {
            const originalMentorString = title.substring(matchIdx, matchIdx + mentorName.length);
            title = title.replace(originalMentorString, `${originalMentorString} (Mentor)`);
          }
        } else {
          const mentorParts = mentorName.split(' ');
          if (mentorParts.length > 1) {
            const initialsName = `${mentorParts[0].charAt(0)} ${mentorParts[mentorParts.length - 1]}`;
            const initialsLower = initialsName.toLowerCase();
            const matchIdx = titleLower.indexOf(initialsLower);
            if (matchIdx !== -1) {
              const originalInitialsString = title.substring(matchIdx, matchIdx + initialsName.length);
              title = title.replace(originalInitialsString, `${originalInitialsString} (Mentor)`);
            }
          }
        }
      }
    }
    
    return title;
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-500 hover:text-slate-700 cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#2563eb] rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowNotifications(false)}
          />
          <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-250">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="font-extrabold text-sm text-slate-800 tracking-tight">Notifications</span>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                  className="text-[10px] text-[#2563eb] font-bold hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Mark read
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
              {paginatedNotifications.length > 0 ? (
                paginatedNotifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 text-xs transition-all duration-200 flex items-start gap-3 hover:bg-slate-50/80 cursor-pointer text-left
                      ${!n.isRead ? "bg-blue-50/30" : ""}`}
                  >
                    <div className="relative flex-shrink-0 mt-1">
                      <span className={`w-2 h-2 rounded-full block ${!n.isRead ? "bg-[#2563eb]" : "bg-slate-300"}`} />
                      {!n.isRead && (
                        <span className="absolute top-0 left-0 w-2 h-2 rounded-full bg-[#2563eb] animate-ping opacity-75" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                          getNotificationColorClass(getSpecificNotificationType(n))
                        }`}>
                          {getSpecificNotificationType(n)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold flex-shrink-0">
                          {dayjs(n.createdAt).format('MMM D, h:mm A')}
                        </span>
                      </div>
                      <h4 className={`text-slate-800 text-xs font-bold leading-snug mb-0.5 ${!n.isRead ? "text-slate-900 font-extrabold" : "text-slate-700"}`}>
                        {getFormattedNotificationTitle(n)}
                      </h4>
                      <p className={`text-slate-500 leading-relaxed text-[11px] line-clamp-2 ${!n.isRead ? "text-slate-600 font-medium" : ""}`}>
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 font-semibold text-xs">
                  No notifications yet
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <div className="border-t border-slate-100 bg-slate-50/50">
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
