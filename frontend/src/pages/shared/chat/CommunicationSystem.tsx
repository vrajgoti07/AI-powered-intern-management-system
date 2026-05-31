import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, HelpCircle, Megaphone, Send, Paperclip,
  CheckCheck, Hash, User, ShieldAlert, Sparkles, Plus, PlusCircle, Search,
  Brain, RefreshCw, Mic, MicOff, Terminal, ChevronRight, Check, ThumbsUp,
  Trash2, Smile, X, Download, Music, Camera, Image, Calendar, BarChart2, FileText
} from 'lucide-react';
import { Sidebar } from '../../../components/common/Sidebar';
import { Navbar } from '../../../components/common/Navbar';
import { Avatar } from '../../../components/common/Avatar';
import { Modal } from '../../../components/common/Modal';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import { useApp } from '../../../hooks/useApp';
import { useInternByUser, useTasks, useInterns } from '../../../hooks/queries';
import api from '../../../services/api';
import { useSocket } from '../../../hooks/useSocket';

const EMOJIS = [
  { char: '😀', name: 'grinning face', cat: 'smileys' },
  { char: '😃', name: 'grinning face with big eyes', cat: 'smileys' },
  { char: '😄', name: 'grinning face with smiling eyes', cat: 'smileys' },
  { char: '😁', name: 'beaming face with smiling eyes', cat: 'smileys' },
  { char: '😆', name: 'grinning squinting face', cat: 'smileys' },
  { char: '😅', name: 'grinning face with sweat', cat: 'smileys' },
  { char: '😂', name: 'face with tears of joy', cat: 'smileys' },
  { char: '🤣', name: 'rolling on the floor laughing', cat: 'smileys' },
  { char: '😊', name: 'smiling face with smiling eyes', cat: 'smileys' },
  { char: '😇', name: 'smiling face with halo', cat: 'smileys' },
  { char: '🙂', name: 'slightly smiling face', cat: 'smileys' },
  { char: '🙃', name: 'upside-down face', cat: 'smileys' },
  { char: '😉', name: 'winking face', cat: 'smileys' },
  { char: '😌', name: 'relieved face', cat: 'smileys' },
  { char: '😍', name: 'smiling face with heart-eyes', cat: 'smileys' },
  { char: '🥰', name: 'smiling face with hearts', cat: 'smileys' },
  { char: '😘', name: 'face blowing a kiss', cat: 'smileys' },
  { char: '😋', name: 'face savoring food', cat: 'smileys' },
  { char: '😛', name: 'face with tongue', cat: 'smileys' },
  { char: '😜', name: 'winking face with tongue', cat: 'smileys' },
  { char: '🤪', name: 'zany face', cat: 'smileys' },
  { char: '🤨', name: 'face with raised eyebrow', cat: 'smileys' },
  { char: '🧐', name: 'face with monocle', cat: 'smileys' },
  { char: '🤓', name: 'nerd face', cat: 'smileys' },
  { char: '😎', name: 'smiling face with sunglasses', cat: 'smileys' },
  { char: '🥳', name: 'partying face', cat: 'smileys' },
  { char: '😏', name: 'smirking face', cat: 'smileys' },
  { char: '😒', name: 'unamused face', cat: 'smileys' },
  { char: '😞', name: 'disappointed face', cat: 'smileys' },
  { char: '😔', name: 'pensive face', cat: 'smileys' },
  { char: '😟', name: 'worried face', cat: 'smileys' },
  { char: '😕', name: 'confused face', cat: 'smileys' },
  { char: '🙁', name: 'slightly frowning face', cat: 'smileys' },
  { char: '☹️', name: 'frowning face', cat: 'smileys' },
  { char: '🥺', name: 'pleading face', cat: 'smileys' },
  { char: '😢', name: 'crying face', cat: 'smileys' },
  { char: '😭', name: 'loudly crying face', cat: 'smileys' },
  { char: '😤', name: 'face with steam from nose', cat: 'smileys' },
  { char: '😠', name: 'angry face', cat: 'smileys' },
  { char: '😡', name: 'pouting face', cat: 'smileys' },
  { char: '🤬', name: 'face with symbols on mouth', cat: 'smileys' },
  { char: '🤯', name: 'exploding head', cat: 'smileys' },
  { char: '😳', name: 'flushed face', cat: 'smileys' },
  { char: '🥵', name: 'hot face', cat: 'smileys' },
  { char: '🥶', name: 'cold face', cat: 'smileys' },
  { char: '😱', name: 'face screaming in fear', cat: 'smileys' },
  { char: '😰', name: 'anxious face with sweat', cat: 'smileys' },
  { char: '😴', name: 'sleeping face', cat: 'smileys' },
  { char: '🤤', name: 'drooling face', cat: 'smileys' },
  { char: '🤢', name: 'nauseated face', cat: 'smileys' },
  { char: '🤮', name: 'face vomiting', cat: 'smileys' },
  { char: '💩', name: 'pile of poo', cat: 'smileys' },
  { char: '👻', name: 'ghost', cat: 'smileys' },
  { char: '👽', name: 'alien', cat: 'smileys' },
  { char: '👾', name: 'alien monster', cat: 'smileys' },
  { char: '🤖', name: 'robot', cat: 'smileys' },
  { char: '👍', name: 'thumbs up', cat: 'smileys' },
  { char: '👎', name: 'thumbs down', cat: 'smileys' },
  { char: '👊', name: 'oncoming fist', cat: 'smileys' },
  { char: '✊', name: 'raised fist', cat: 'smileys' },
  { char: '🤛', name: 'left-facing fist', cat: 'smileys' },
  { char: '🤜', name: 'right-facing fist', cat: 'smileys' },
  { char: '👏', name: 'clapping hands', cat: 'smileys' },
  { char: '🙌', name: 'raising hands', cat: 'smileys' },
  { char: '🫶', name: 'heart hands', cat: 'smileys' },
  { char: '🙏', name: 'folded hands', cat: 'smileys' },
  { char: '🧠', name: 'brain', cat: 'smileys' },
  { char: '👀', name: 'eyes', cat: 'smileys' },
  { char: '❤️', name: 'red heart', cat: 'smileys' },
  { char: '💔', name: 'broken heart', cat: 'smileys' },

  { char: '⚽', name: 'soccer ball', cat: 'activities' },
  { char: '🏀', name: 'basketball', cat: 'activities' },
  { char: '🏈', name: 'american football', cat: 'activities' },
  { char: '⚾', name: 'baseball', cat: 'activities' },
  { char: '🎾', name: 'tennis', cat: 'activities' },
  { char: ' Volleyball', name: 'volleyball', cat: 'activities' },
  { char: '🏓', name: 'ping pong', cat: 'activities' },
  { char: '🏸', name: 'badminton', cat: 'activities' },
  { char: '🥊', name: 'boxing glove', cat: 'activities' },
  { char: '🏹', name: 'bow and arrow', cat: 'activities' },
  { char: '🛹', name: 'skateboard', cat: 'activities' },
  { char: '🏆', name: 'trophy', cat: 'activities' },
  { char: '🥇', name: '1st place medal', cat: 'activities' },
  { char: '🎮', name: 'video game', cat: 'activities' },
  { char: '🎲', name: 'game die', cat: 'activities' },
  { char: '🎨', name: 'artist palette', cat: 'activities' },
  { char: '🎭', name: 'performing arts', cat: 'activities' },
  
  { char: '🚗', name: 'automobile car', cat: 'travel' },
  { char: '🚓', name: 'police car', cat: 'travel' },
  { char: '🚑', name: 'ambulance', cat: 'travel' },
  { char: '🚒', name: 'fire engine', cat: 'travel' },
  { char: '🏍️', name: 'motorcycle', cat: 'travel' },
  { char: '🚲', name: 'bicycle', cat: 'travel' },
  { char: '✈️', name: 'airplane', cat: 'travel' },
  { char: '🚀', name: 'rocket', cat: 'travel' },
  { char: '🛸', name: 'flying saucer', cat: 'travel' },
  { char: '🗺️', name: 'world map', cat: 'travel' },
  { char: '⛺', name: 'tent', cat: 'travel' },
  { char: '🏟️', name: 'stadium', cat: 'travel' },
  { char: '🏛️', name: 'classical building', cat: 'travel' },
  { char: '🌃', name: 'night with stars', cat: 'travel' },
  
  { char: '💡', name: 'light bulb idea', cat: 'objects' },
  { char: '💻', name: 'laptop computer', cat: 'objects' },
  { char: '🖥️', name: 'desktop computer', cat: 'objects' },
  { char: '🖨️', name: 'printer', cat: 'objects' },
  { char: '⌨️', name: 'keyboard', cat: 'objects' },
  { char: '鼠标', name: 'computer mouse', cat: 'objects' },
  { char: '📷', name: 'camera', cat: 'objects' },
  { char: '📸', name: 'camera with flash', cat: 'objects' },
  { char: '🔍', name: 'magnifying glass left', cat: 'objects' },
  { char: '🔎', name: 'magnifying glass right', cat: 'objects' },
  { char: '📖', name: 'open book', cat: 'objects' },
  { char: '📝', name: 'memo text', cat: 'objects' },
  { char: '✉️', name: 'envelope mail', cat: 'objects' },
  { char: '📦', name: 'package parcel', cat: 'objects' },
  { char: '📎', name: 'paperclip', cat: 'objects' },
  { char: '🔒', name: 'locked lock', cat: 'objects' },
  { char: '🔑', name: 'key', cat: 'objects' },
  { char: '🛠️', name: 'tools hammer wrench', cat: 'objects' },
  { char: '⚙️', name: 'gear', cat: 'objects' },
  { char: '🛒', name: 'shopping cart', cat: 'objects' },
  
  { char: '☮️', name: 'peace symbol', cat: 'symbols' },
  { char: '☯️', name: 'yin yang', cat: 'symbols' },
  { char: '🛑', name: 'stop sign', cat: 'symbols' },
  { char: '⛔', name: 'no entry', cat: 'symbols' },
  { char: '💯', name: 'hundred points perfect', cat: 'symbols' },
  { char: '⭐', name: 'star', cat: 'symbols' },
  { char: '🔥', name: 'fire hot', cat: 'symbols' },
  { char: '✨', name: 'sparkles', cat: 'symbols' },
  { char: '💥', name: 'collision crash explosion', cat: 'symbols' },
  { char: '🎉', name: 'party popper celebration', cat: 'symbols' },
  { char: '🏁', name: 'chequered flag', cat: 'symbols' },
  { char: '🚩', name: 'triangular flag', cat: 'symbols' },
  { char: '🇮🇳', name: 'india flag', cat: 'symbols' },
  { char: '🇺🇸', name: 'united states flag', cat: 'symbols' },
  { char: '🇬🇧', name: 'united kingdom flag', cat: 'symbols' },
  { char: '🇨🇦', name: 'canada flag', cat: 'symbols' }
];

export const CommunicationSystem: React.FC = () => {
  const { user } = useAuth();
  const { state, dispatch } = useApp();
  const userName = user?.name || "Intern";
  const userRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Intern";
  const userDisplay = `${userName} (${userRole})`;

  const formatMessageText = (text: string, isUser: boolean) => {
    if (!text) return '';
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className={`font-black ${isUser ? 'text-white' : 'text-indigo-600'}`}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };
  
  const { data: myInternData } = useInternByUser(user?.id || '');
  const { data: myTasks } = useTasks();

  const isMentor = user?.role === 'mentor';
  const resolvedDeptId = (user as any)?.mentor?.departmentId || (user as any)?.headedDepartment?.id;
  const { data: interns = [] } = useInterns(
    isMentor && resolvedDeptId
      ? { departmentId: resolvedDeptId }
      : undefined
  );
  const [selectedInternId, setSelectedInternId] = useState<string | null>(null);

  // Auto-select first intern if mentor
  useEffect(() => {
    if (isMentor && interns.length > 0 && !selectedInternId) {
      setSelectedInternId(interns[0].id);
    }
  }, [interns, isMentor, selectedInternId]);

  // Derive actual mentor name from DB data
  const mentorName = myInternData?.mentor?.user?.name || "Your Mentor";
  const mentorDisplay = `${mentorName} (Mentor)`;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showList, setShowList] = useState(true);
  
  // Hub Active Tab
  const [activeTab, setActiveTab] = useState<'chat' | 'tutor' | 'tickets' | 'forum'>('chat');
  
  // 1. Live Chat States
  const [chatChannel, setChatChannel] = useState('#general');
  const [chatText, setChatText] = useState('');
  const [localDeletedIds, setLocalDeletedIds] = useState<string[]>([]);

  // Load locally deleted message IDs from localStorage
  useEffect(() => {
    if (user?.id) {
      try {
        const localDeletedKey = `deleted_locally_${user.id}`;
        const existingDeleted = localStorage.getItem(localDeletedKey);
        setLocalDeletedIds(existingDeleted ? JSON.parse(existingDeleted) : []);
      } catch (e) {
        console.error("Failed to load local deletions:", e);
      }
    }
  }, [user]);

  const [chatMessages, setChatMessages] = useState<Record<string, {
    id?: string;
    sender: string;
    role: string;
    text: string;
    time: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    metadata?: any;
  }[]>>({});

  // Rich Comms Features State
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  const [showContactModal, setShowContactModal] = useState(false);

  // Message Interaction Handler (Poll Votes / Event RSVP)
  const handleMessageInteraction = async (messageId: string, payload: { type: 'vote' | 'rsvp'; optionId?: string; status?: 'yes' | 'maybe' | 'no' }) => {
    try {
      const response = await api.patch(`/messages/${messageId}/interact`, payload);
      const updatedMsg = response.data?.data;
      if (updatedMsg) {
        setChatMessages(prev => {
          const list = prev[chatChannel] || [];
          const updatedList = list.map(m => m.id === messageId ? {
            ...m,
            metadata: updatedMsg.metadata
          } : m);
          return {
            ...prev,
            [chatChannel]: updatedList
          };
        });
        toast.success("Action recorded!");
      }
    } catch (err) {
      console.error("Interaction failed:", err);
      toast.error("Failed to update status.");
    }
  };

  // Special message senders
  const handleSendPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2 || !activeConversationId) return;

    const filteredOptions = pollOptions.filter(o => o.trim()).map((text, idx) => ({
      id: `opt-${idx}-${Date.now()}`,
      text: text.trim()
    }));

    const metadata = {
      type: 'poll',
      question: pollQuestion.trim(),
      options: filteredOptions,
      votes: filteredOptions.reduce((acc, opt) => ({ ...acc, [opt.id]: [] }), {})
    };

    setShowPollModal(false);
    setPollQuestion('');
    setPollOptions(['', '']);

    try {
      const response = await api.post(`/messages/${activeConversationId}`, {
        content: `📊 Poll: ${metadata.question}`,
        metadata
      });
      const newMsg = response.data?.data;
      if (newMsg) {
        setChatMessages(prev => ({
          ...prev,
          [chatChannel]: [...(prev[chatChannel] || []), {
            id: newMsg.id,
            sender: `${newMsg.sender.name} (${newMsg.sender.role.charAt(0) + newMsg.sender.role.slice(1).toLowerCase()})`,
            role: newMsg.sender.role.toLowerCase(),
            text: newMsg.content,
            time: new Date(newMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            metadata: newMsg.metadata
          }]
        }));
        toast.success("Poll created successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create poll.");
    }
  };

  const handleSendEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate || !eventTime || !eventLocation.trim() || !activeConversationId) return;

    const metadata = {
      type: 'event',
      title: eventTitle.trim(),
      date: eventDate,
      time: eventTime,
      location: eventLocation.trim(),
      rsvps: { yes: [], maybe: [], no: [] }
    };

    setShowEventModal(false);
    setEventTitle('');
    setEventDate('');
    setEventTime('');
    setEventLocation('');

    try {
      const response = await api.post(`/messages/${activeConversationId}`, {
        content: `📅 Event: ${metadata.title}`,
        metadata
      });
      const newMsg = response.data?.data;
      if (newMsg) {
        setChatMessages(prev => ({
          ...prev,
          [chatChannel]: [...(prev[chatChannel] || []), {
            id: newMsg.id,
            sender: `${newMsg.sender.name} (${newMsg.sender.role.charAt(0) + newMsg.sender.role.slice(1).toLowerCase()})`,
            role: newMsg.sender.role.toLowerCase(),
            text: newMsg.content,
            time: new Date(newMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            metadata: newMsg.metadata
          }]
        }));
        toast.success("Meeting event created!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create event.");
    }
  };

  const handleShareContact = async (cUser: { id: string; name: string; email: string; role: string; avatarUrl?: string }) => {
    if (!activeConversationId) return;

    const metadata = {
      type: 'contact',
      name: cUser.name,
      email: cUser.email,
      role: cUser.role,
      avatarUrl: cUser.avatarUrl || ''
    };

    setShowContactModal(false);

    try {
      const response = await api.post(`/messages/${activeConversationId}`, {
        content: `👤 Contact: ${metadata.name}`,
        metadata
      });
      const newMsg = response.data?.data;
      if (newMsg) {
        setChatMessages(prev => ({
          ...prev,
          [chatChannel]: [...(prev[chatChannel] || []), {
            id: newMsg.id,
            sender: `${newMsg.sender.name} (${newMsg.sender.role.charAt(0) + newMsg.sender.role.slice(1).toLowerCase()})`,
            role: newMsg.sender.role.toLowerCase(),
            text: newMsg.content,
            time: new Date(newMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            metadata: newMsg.metadata
          }]
        }));
        toast.success("Contact shared!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to share contact.");
    }
  };

  const handleSendSticker = async (stickerUrl: string, name: string) => {
    if (!activeConversationId) return;
    try {
      const response = await api.post(`/messages/${activeConversationId}`, {
        content: `🎨 Sticker: ${name}`,
        metadata: { type: 'sticker', stickerUrl }
      });
      const newMsg = response.data?.data;
      if (newMsg) {
        setChatMessages(prev => ({
          ...prev,
          [chatChannel]: [...(prev[chatChannel] || []), {
            id: newMsg.id,
            sender: `${newMsg.sender.name} (${newMsg.sender.role.charAt(0) + newMsg.sender.role.slice(1).toLowerCase()})`,
            role: newMsg.sender.role.toLowerCase(),
            text: newMsg.content,
            time: new Date(newMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            metadata: newMsg.metadata
          }]
        }));
        setShowEmojiPicker(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendGif = async (gifUrl: string) => {
    if (!activeConversationId) return;
    try {
      const response = await api.post(`/messages/${activeConversationId}`, {
        content: `🎬 GIF`,
        metadata: { type: 'gif', gifUrl }
      });
      const newMsg = response.data?.data;
      if (newMsg) {
        setChatMessages(prev => ({
          ...prev,
          [chatChannel]: [...(prev[chatChannel] || []), {
            id: newMsg.id,
            sender: `${newMsg.sender.name} (${newMsg.sender.role.charAt(0) + newMsg.sender.role.slice(1).toLowerCase()})`,
            role: newMsg.sender.role.toLowerCase(),
            text: newMsg.content,
            time: new Date(newMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            metadata: newMsg.metadata
          }]
        }));
        setShowEmojiPicker(false);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const socket = useSocket();

  useEffect(() => {
    if (!socket || !activeConversationId) return;

    socket.emit('join-room', { roomId: activeConversationId, name: user?.name });

    const handleReceiveMessage = (message: any) => {
      console.log('[Socket] Received message:', message);
      const formattedMsg = {
        id: message.id,
        senderId: message.senderId,
        sender: message.senderName ? `${message.senderName} (${message.senderId === user?.id ? 'You' : 'Member'})` : 'Member',
        role: message.senderId === user?.id ? 'user' : 'member',
        text: message.content,
        time: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => {
        const currentList = prev[chatChannel] || [];
        if (currentList.some((m) => m.id === message.id)) return prev;
        return {
          ...prev,
          [chatChannel]: [...currentList, formattedMsg],
        };
      });
    };

    const handleUserTyping = (data: { name: string; isTyping: boolean }) => {
      if (data.isTyping) {
        setTypingUser(data.name);
      } else {
        setTypingUser(null);
      }
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('user-typing', handleUserTyping);

    return () => {
      socket.emit('leave-room', { roomId: activeConversationId, name: user?.name });
      socket.off('receive-message', handleReceiveMessage);
      socket.off('user-typing', handleUserTyping);
    };
  }, [socket, activeConversationId, chatChannel, user]);

  // WhatsApp Chat rich states
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [emojiTab, setEmojiTab] = useState<'all' | 'smileys' | 'activities' | 'travel' | 'objects' | 'symbols'>('all');
  const [pickerMode, setPickerMode] = useState<'emoji' | 'gif' | 'sticker'>('emoji');
  
  // File upload state
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    localPreviewUrl?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentButtonRef = useRef<HTMLButtonElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const micTargetRef = useRef<'chat' | 'bot'>('chat');

  // Voice Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Delete message states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMsgToDelete, setSelectedMsgToDelete] = useState<any>(null);

  // Premium Camera Capture states
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        showAttachmentMenu && 
        attachmentButtonRef.current && 
        !attachmentButtonRef.current.contains(target) &&
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(target)
      ) {
        setShowAttachmentMenu(false);
      }
      if (
        showEmojiPicker && 
        emojiButtonRef.current && 
        !emojiButtonRef.current.contains(target) &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAttachmentMenu, showEmojiPicker]);

  const triggerFileInput = (acceptType?: string) => {
    if (fileInputRef.current) {
      if (acceptType) {
        fileInputRef.current.accept = acceptType;
      } else {
        fileInputRef.current.removeAttribute('accept');
      }
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    setShowAttachmentMenu(false);

    let localPreviewUrl = '';
    if (file.type.startsWith('image/')) {
      localPreviewUrl = URL.createObjectURL(file);
    }

    setAttachedFile({
      fileUrl: '',
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      localPreviewUrl
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/messages/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data?.success && response.data?.data) {
        const { fileUrl, fileName, fileType, fileSize } = response.data.data;
        setAttachedFile({
          fileUrl,
          fileName,
          fileType,
          fileSize,
          localPreviewUrl
        });
        toast.success("File attached successfully!");
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload attachment.");
      setAttachedFile(null);
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Fetch or create conversation for the active channel
  useEffect(() => {
    const fetchChannelConversation = async () => {
      try {
        const cleanChan = chatChannel.startsWith('#') ? chatChannel.slice(1) : chatChannel;
        const isPrivate = cleanChan === 'tech-support' || cleanChan === 'stipend-queries';
        
        let url = `/messages/channel/${cleanChan}`;
        if (isMentor && isPrivate) {
          if (selectedInternId) {
            url += `?internId=${selectedInternId}`;
          } else {
            return;
          }
        }

        const response = await api.get(url);
        const conversation = response.data?.data;
        if (conversation) {
          setActiveConversationId(conversation.id);
          
          // Filter out locally deleted message IDs using localStorage directly to avoid stale closures
          const localDeletedKey = `deleted_locally_${user?.id}`;
          const existingDeleted = localStorage.getItem(localDeletedKey);
          const deletedIds = existingDeleted ? JSON.parse(existingDeleted) : [];

          const formatted = conversation.messages
            .filter((msg: any) => !deletedIds.includes(msg.id))
            .map((msg: any) => ({
              id: msg.id,
              senderId: msg.senderId,
              sender: `${msg.sender.name} (${msg.sender.role.charAt(0) + msg.sender.role.slice(1).toLowerCase()})`,
              role: msg.sender.role.toLowerCase(),
              text: msg.content,
              time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              fileUrl: msg.fileUrl,
              fileName: msg.fileName,
              fileType: msg.fileType,
              fileSize: msg.fileSize,
              metadata: msg.metadata,
            }));
          setChatMessages(prev => ({
            ...prev,
            [chatChannel]: formatted
          }));
        }
      } catch (error) {
        console.error("Error fetching channel conversation:", error);
      }
    };

    if (user) {
      fetchChannelConversation();
    }
  }, [chatChannel, user, selectedInternId, isMentor]);

  // Real-time polling loop to sync conversation messages every 3 seconds
  useEffect(() => {
    if (!activeConversationId || activeTab !== 'chat') return;

    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/messages/${activeConversationId}`);
        const messages = response.data?.messages;
        if (messages) {
          // Filter out locally deleted message IDs using localStorage directly to avoid stale closures
          const localDeletedKey = `deleted_locally_${user?.id}`;
          const existingDeleted = localStorage.getItem(localDeletedKey);
          const deletedIds = existingDeleted ? JSON.parse(existingDeleted) : [];

          const formatted = messages
            .filter((msg: any) => !deletedIds.includes(msg.id))
            .map((msg: any) => ({
              id: msg.id,
              senderId: msg.senderId,
              sender: `${msg.sender.name} (${msg.sender.role.charAt(0) + msg.sender.role.slice(1).toLowerCase()})`,
              role: msg.sender.role.toLowerCase(),
              text: msg.content,
              time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              fileUrl: msg.fileUrl,
              fileName: msg.fileName,
              fileType: msg.fileType,
              fileSize: msg.fileSize,
              metadata: msg.metadata,
            }));
          setChatMessages(prev => ({
            ...prev,
            [chatChannel]: formatted
          }));
        }
      } catch (error) {
        console.error("Error polling messages:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeConversationId, activeTab, chatChannel, selectedInternId]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!chatText.trim() && !attachedFile) || !activeConversationId) return;

    const messageText = chatText.trim() || (attachedFile ? `Shared file: ${attachedFile.fileName}` : '');
    const sendFile = attachedFile;
    
    setChatText('');
    setAttachedFile(null);

    try {
      const response = await api.post(`/messages/${activeConversationId}`, {
        content: messageText,
        fileUrl: sendFile?.fileUrl || undefined,
        fileName: sendFile?.fileName || undefined,
        fileType: sendFile?.fileType || undefined,
        fileSize: sendFile?.fileSize || undefined,
      });
      const newMsg = response.data?.data;
      if (newMsg) {
        const formattedMsg = {
          id: newMsg.id,
          senderId: newMsg.senderId,
          sender: `${newMsg.sender.name} (${newMsg.sender.role.charAt(0) + newMsg.sender.role.slice(1).toLowerCase()})`,
          role: newMsg.sender.role.toLowerCase(),
          text: newMsg.content,
          time: new Date(newMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fileUrl: newMsg.fileUrl,
          fileName: newMsg.fileName,
          fileType: newMsg.fileType,
          fileSize: newMsg.fileSize,
          metadata: newMsg.metadata,
        };
        setChatMessages(prev => ({
          ...prev,
          [chatChannel]: [...(prev[chatChannel] || []), formattedMsg]
        }));

        // Emit socket message for real-time delivery
        if (socket && activeConversationId) {
          socket.emit('send-message', {
            roomId: activeConversationId,
            senderId: user?.id || '',
            senderName: user?.name || 'User',
            content: messageText,
          });

          // Stop typing state on send
          socket.emit('typing', {
            roomId: activeConversationId,
            name: user?.name || 'User',
            isTyping: false,
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  // 2. AI Tutor Chatbot States
  const [botInput, setBotInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll AI chatbot history
  useEffect(() => {
    if (activeTab === 'tutor') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.chatHistory, isBotTyping, activeTab]);

  // Speech Recognition Setup
  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (micTargetRef.current === 'bot') {
          setBotInput(transcript);
        } else {
          setChatText(prev => prev ? `${prev} ${transcript}` : transcript);
        }
        setMicActive(false);
        toast.success("Voice input captured!");
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setMicActive(false);
        toast.error("Voice recognition failed.");
      };

      recognition.onend = () => {
        setMicActive(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleSendBotMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    dispatch({
      type: 'SEND_CHAT_MESSAGE',
      payload: { sender: 'user', text: textToSend.trim() }
    });

    setIsBotTyping(true);

    try {
      const formattedHistory = state.chatHistory.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      // Build task data to pass to AI service
      const taskData = Array.isArray(myTasks) ? myTasks.map((t: any) => ({
        title: t.title,
        status: t.status,
        dueDate: t.dueDate,
        priority: t.priority,
      })) : [];

      const response = await api.post('/ai/chatbot', {
        message: textToSend.trim(),
        history: formattedHistory,
        context: {
          user_name: user?.name,
          intern_id: myInternData?.id,
          attendance: myInternData?.attendance,
          score: myInternData?.score,
          mentor_name: mentorName,
          department: myInternData?.department?.name,
          tasks: taskData,
        }
      });

      const botResponse = response.data?.data?.reply || response.data?.data?.response || 'I could not process that request.';

      dispatch({
        type: 'SEND_CHAT_MESSAGE',
        payload: { sender: 'bot', text: botResponse }
      });
    } catch (error) {
      console.error(error);
      dispatch({
        type: 'SEND_CHAT_MESSAGE',
        payload: { sender: 'bot', text: "I'm currently offline. The AI engine is unavailable." }
      });
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleBotFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!botInput.trim()) return;
    handleSendBotMessage(botInput);
    setBotInput('');
  };

  const handleClearHistory = () => {
    dispatch({ type: 'CLEAR_CHAT_HISTORY' });
    toast.success("AI Chat history cleared!");
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }

    if (!micActive) {
      try {
        micTargetRef.current = 'bot';
        recognitionRef.current.start();
        setMicActive(true);
        toast.success("Listening...");
      } catch (e) {
        setMicActive(false);
      }
    } else {
      recognitionRef.current.stop();
      setMicActive(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
        
        // Stop all tracks on the stream to release the mic
        stream.getTracks().forEach(track => track.stop());

        setIsUploadingFile(true);
        setAttachedFile({
          fileUrl: '',
          fileName: audioFile.name,
          fileType: audioFile.type,
          fileSize: audioFile.size,
          localPreviewUrl: ''
        });

        try {
          const formData = new FormData();
          formData.append('file', audioFile);

          const response = await api.post('/messages/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          if (response.data?.success && response.data?.data) {
            const { fileUrl, fileName, fileType, fileSize } = response.data.data;
            
            // Post directly to the conversation
            if (activeConversationId) {
              const sendRes = await api.post(`/messages/${activeConversationId}`, {
                content: "🎙️ Voice Message",
                fileUrl,
                fileName: fileName || 'voice-note.webm',
                fileType: fileType || 'audio/webm',
                fileSize: fileSize || 0
              });

              const newMsg = sendRes.data?.data;
              if (newMsg) {
                const formattedMsg = {
                  id: newMsg.id,
                  senderId: newMsg.senderId,
                  sender: `${newMsg.sender.name} (${newMsg.sender.role.charAt(0) + newMsg.sender.role.slice(1).toLowerCase()})`,
                  role: newMsg.sender.role.toLowerCase(),
                  text: newMsg.content,
                  time: new Date(newMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  fileUrl: newMsg.fileUrl,
                  fileName: newMsg.fileName,
                  fileType: newMsg.fileType,
                  fileSize: newMsg.fileSize,
                };
                setChatMessages(prev => ({
                  ...prev,
                  [chatChannel]: [...(prev[chatChannel] || []), formattedMsg]
                }));
                toast.success("Voice note sent successfully!");
              }
            }
          }
        } catch (err) {
          console.error("Error sending voice note:", err);
          toast.error("Failed to send voice note.");
        } finally {
          setIsUploadingFile(false);
          setAttachedFile(null);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      toast.success("Recording voice note...");
    } catch (error) {
      console.error("Microphone access error:", error);
      toast.error("Microphone access denied or not available.");
    }
  };

  const stopVoiceRecording = (shouldSend = true) => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (!shouldSend) {
        // Discard the recording
        mediaRecorderRef.current.onstop = () => {
          setIsRecording(false);
          toast.success("Voice note discarded.");
        };
      }
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleChatMic = () => {
    if (isRecording) {
      stopVoiceRecording(true);
    } else {
      startVoiceRecording();
    }
  };

  const handleDeleteMessage = async (deleteForEveryone: boolean) => {
    if (!selectedMsgToDelete) return;

    if (deleteForEveryone) {
      if (!selectedMsgToDelete.id) {
        toast.error("Cannot delete a message with missing ID.");
        return;
      }
      try {
        await api.delete(`/messages/${selectedMsgToDelete.id}`);
        toast.success("Message deleted for everyone!");
      } catch (err: any) {
        console.error("Delete failed:", err);
        toast.error("Failed to delete message for everyone.");
        return;
      }
    } else {
      try {
        const localDeletedKey = `deleted_locally_${user?.id}`;
        const existingDeleted = localStorage.getItem(localDeletedKey);
        const deletedIds = existingDeleted ? JSON.parse(existingDeleted) : [];
        if (selectedMsgToDelete.id && !deletedIds.includes(selectedMsgToDelete.id)) {
          const updatedDeletedIds = [...deletedIds, selectedMsgToDelete.id];
          localStorage.setItem(localDeletedKey, JSON.stringify(updatedDeletedIds));
          setLocalDeletedIds(updatedDeletedIds);
        }
      } catch (e) {
        console.error("Failed to save local deletion:", e);
      }
      toast.success("Message deleted locally!");
    }

    // Update local React state to remove the message
    setChatMessages(prev => {
      const channelMsgs = prev[chatChannel] || [];
      const updatedMsgs = channelMsgs.filter(m => m.id !== selectedMsgToDelete.id);
      return {
        ...prev,
        [chatChannel]: updatedMsgs
      };
    });

    setShowDeleteModal(false);
    setSelectedMsgToDelete(null);
  };

  // Camera capture methods
  const handleOpenCameraModal = async () => {
    setShowCameraModal(true);
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } 
      });
      setCameraStream(stream);
      // Give React a small tick to mount the video element before setting the source
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err) {
      console.error("Camera access failed:", err);
      toast.error("Failed to access camera. Please check permissions.");
      setShowCameraModal(false);
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedPhoto(dataUrl);
      }
    } catch (err) {
      console.error("Photo capture failed:", err);
      toast.error("Failed to capture photo.");
    }
  };

  const handleAttachCapturedPhoto = async () => {
    if (!capturedPhoto) return;
    setIsUploadingFile(true);
    setShowCameraModal(false);

    // Stop camera stream tracks to turn off the physical camera immediately
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

    setAttachedFile({
      fileUrl: '',
      fileName: `snapshot-${Date.now()}.jpg`,
      fileType: 'image/jpeg',
      fileSize: 0,
      localPreviewUrl: capturedPhoto
    });

    try {
      // Convert Data URL to Blob
      const res = await fetch(capturedPhoto);
      const blob = await res.blob();
      const file = new File([blob], `snapshot-${Date.now()}.jpg`, { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/messages/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data?.success && response.data?.data) {
        const { fileUrl, fileName, fileType, fileSize } = response.data.data;
        setAttachedFile({
          fileUrl,
          fileName: fileName || `snapshot-${Date.now()}.jpg`,
          fileType: fileType || 'image/jpeg',
          fileSize: fileSize || blob.size,
          localPreviewUrl: capturedPhoto
        });
        toast.success("Photo captured and attached!");
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("Failed uploading captured photo:", err);
      toast.error("Failed to upload captured photo.");
      setAttachedFile(null);
    } finally {
      setIsUploadingFile(false);
      setCapturedPhoto(null);
    }
  };

  const handleCloseCameraModal = () => {
    setShowCameraModal(false);
    setCapturedPhoto(null);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const suggestedPrompts = [
    "What is my attendance?",
    "What is my current score?",
    "Show my pending tasks",
    "Certificate eligibility",
    "Who is my mentor?",
  ];

  // 3. Ticket States
  const [tickets, setTickets] = useState<{id: string; category: string; title: string; status: string; priority: string; replies: number; createdAt: string}[]>([]);
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [ticketCategory, setTicketCategory] = useState('Hardware/IT');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketPriority, setTicketPriority] = useState('Medium');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim()) return;

    const newT = {
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      category: ticketCategory,
      title: ticketTitle,
      status: "Open",
      priority: ticketPriority,
      replies: 0,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTickets(prev => [newT, ...prev]);
    setTicketTitle('');
    setTicketPriority('Medium');
    setShowAddTicket(false);
    toast.success("Helpdesk ticket created successfully!");
  };

  const handleRemoveTicket = (id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id));
    toast.success("Ticket removed successfully!");
  };

  // 4. Discussion Forum States
  const [forumSearch, setForumSearch] = useState('');
  const [forumPosts, setForumPosts] = useState<{id: number; title: string; votes: number; category: string; author: string; createdAt: string}[]>([]);
  const [showAddPost, setShowAddPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('General');
  const nextPostId = useRef(1);

  const handleForumUpvote = (id: number) => {
    setForumPosts(prev => prev.map(p => p.id === id ? { ...p, votes: p.votes + 1 } : p));
    toast.success("Post upvoted!");
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim()) return;

    const newPost = {
      id: nextPostId.current++,
      title: newPostTitle,
      votes: 0,
      category: newPostCategory,
      author: userName,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setForumPosts(prev => [newPost, ...prev]);
    setNewPostTitle('');
    setShowAddPost(false);
    toast.success("Discussion post created!");
  };

  const handleRemovePost = (id: number) => {
    setForumPosts(prev => prev.filter(p => p.id !== id));
    toast.success("Post removed successfully!");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="Internal Messaging Network" />

        {/* Scrollable Container */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col space-y-4">
          
          {/* Top Tabs Controller with premium pill design */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex-shrink-0">
            <div className="text-left">
              <span className="text-xs font-bold text-[#2563eb] bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">Workspace Comms</span>
              <h1 className="text-lg font-black text-slate-800 tracking-tight mt-1.5">
                {activeTab === 'chat' && "Collaboration Channels"}
                {activeTab === 'tutor' && "AI Learning Copilot"}
                {activeTab === 'tickets' && "Query Helpdesk Tickets"}
                {activeTab === 'forum' && "Discussion Forum"}
              </h1>
            </div>

            {/* Conditionally show tabs ONLY for interns (hide completely for mentors) */}
            {!isMentor && (
              <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/40">
                {[
                  { key: 'chat', label: 'Live Chat', icon: MessageSquare },
                  { key: 'tutor', label: 'AI Tutor', icon: Brain },
                  { key: 'tickets', label: 'Tickets', icon: HelpCircle },
                  { key: 'forum', label: 'Forum', icon: Megaphone }
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  const active = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border-0 outline-none ${
                        active 
                          ? 'bg-[#2563eb] text-white shadow-md shadow-blue-100' 
                          : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                      }`}
                    >
                      <TabIcon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col text-left min-h-0 h-0">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: Live Channels Chat */}
              {activeTab === 'chat' && (
                <motion.div 
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-1 overflow-hidden w-full h-full min-h-0"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 w-full h-full min-h-0">
                    {/* Channels list sidebar */}
                    <div className={`${showList ? 'flex' : 'hidden'} lg:flex lg:col-span-1 border-r border-slate-100 p-5 flex flex-col gap-6 h-full bg-slate-50/20 overflow-y-auto min-h-0`}>
                      <div className="space-y-4">
                        <h4 className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Channels
                        </h4>
                        <div className="space-y-1">
                          {['#general', '#tech-support', '#stipend-queries'].map(chan => (
                            <div 
                              key={chan} 
                              onClick={() => { setChatChannel(chan); setShowList(false); }}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-xs font-bold transition-all duration-205 ${
                                chatChannel === chan 
                                  ? 'bg-blue-50 text-[#2563eb]' 
                                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                              }`}
                            >
                              <Hash className="w-3.5 h-3.5" /> {chan.slice(1)}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mentor-only Cohort Intern Selector for Private Tech-support & Stipend Channels */}
                      {isMentor && (chatChannel === '#tech-support' || chatChannel === '#stipend-queries') && (
                        <div className="space-y-3 pt-3 border-t border-slate-100 text-left">
                          <h4 className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" /> Select Intern
                          </h4>
                          <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                            {interns.length === 0 ? (
                              <p className="text-[10px] font-bold text-slate-400 italic">No interns assigned</p>
                            ) : (
                              interns.map((intern: any) => {
                                const active = selectedInternId === intern.id;
                                return (
                                  <div
                                    key={intern.id}
                                    onClick={() => { setSelectedInternId(intern.id); setShowList(false); }}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 border ${
                                      active 
                                        ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-sm font-extrabold' 
                                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-200'
                                    }`}
                                  >
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] ${
                                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      {intern.user?.name?.charAt(0) || 'I'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-bold truncate leading-tight">{intern.user?.name}</p>
                                      <p className={`text-[8px] truncate leading-normal mt-0.5 ${active ? 'text-white/70' : 'text-slate-400'}`}>
                                        {intern.college}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat message window */}
                    <div className={`${!showList ? 'flex' : 'hidden'} lg:flex lg:col-span-3 p-5 flex flex-col justify-between h-full relative min-h-0`}>
                      
                      {/* Chat Header */}
                      <div className="pb-3 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                        <button
                          onClick={() => setShowList(true)}
                          className="flex lg:hidden items-center gap-1 text-[10px]
                          font-extrabold text-slate-500 hover:text-slate-800
                          mr-3 cursor-pointer bg-transparent border-0 p-0 flex-shrink-0"
                        >
                          ← Back
                        </button>
                        <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1"><Hash className="w-4 h-4 text-[#2563eb]" /> {chatChannel.slice(1)}</span>
                        <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">Active Stream</span>
                      </div>

                      {/* Messages Body */}
                      <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
                        {(chatMessages[chatChannel] || [])
                          .filter((m: any) => !localDeletedIds.includes(m.id))
                          .map((m, idx) => (
                          <div key={idx} className="flex items-start gap-3 group">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${
                              m.role === 'mentor' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-teal-500 to-emerald-600'
                            }`}>
                              {m.sender.charAt(0)}
                            </div>
                            <div className="text-xs space-y-1 flex-grow min-w-0">
                              <div className="flex gap-2 items-center text-left justify-between w-full">
                                <div className="flex gap-2 items-center min-w-0">
                                  <span className="font-extrabold text-slate-700 truncate">{m.sender}</span>
                                  <span className="text-[8px] text-slate-400 font-bold flex-shrink-0">{m.time}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedMsgToDelete(m);
                                    setShowDeleteModal(true);
                                  }}
                                  className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center cursor-pointer border-0 bg-transparent opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              
                              {m.metadata?.type === 'sticker' ? (
                                <div className="p-0 border-0 bg-transparent flex items-center justify-center max-w-[150px] overflow-hidden rounded-xl">
                                  <img 
                                    src={m.metadata.stickerUrl} 
                                    alt="Sticker" 
                                    className="w-full h-auto max-h-[120px] object-contain hover:scale-105 duration-250 transition-transform" 
                                  />
                                </div>
                              ) : (
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-650 font-semibold leading-relaxed w-fit space-y-2 text-left">
                                  {m.metadata?.type === 'contact' ? (
                                    <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-[280px] text-left space-y-2.5">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-md overflow-hidden flex-shrink-0">
                                          {m.metadata.avatarUrl ? (
                                            <img src={m.metadata.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                                          ) : m.metadata.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-bold text-slate-800 truncate">{m.metadata.name}</p>
                                          <span className="inline-block text-[8px] bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5 shadow-sm">
                                            {m.metadata.role}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="pt-2 border-t border-slate-100 space-y-1">
                                        <p className="text-[9px] text-slate-500 font-semibold truncate">📧 {m.metadata.email}</p>
                                      </div>
                                      <button 
                                        type="button" 
                                        onClick={() => {
                                          toast.success(`Opening direct chat with ${m.metadata.name}`);
                                        }}
                                        className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563eb] text-[10px] font-black rounded-xl transition-colors cursor-pointer border-0 mt-1 flex items-center justify-center gap-1 shadow-sm"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" /> Direct Message
                                      </button>
                                    </div>
                                  ) : m.metadata?.type === 'poll' ? (
                                    <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-md min-w-[260px] text-left space-y-3">
                                      <div>
                                        <span className="text-[8px] text-[#2563eb] font-extrabold uppercase tracking-wider bg-blue-55 px-2.5 py-0.5 rounded-full shadow-sm">Workspace Poll</span>
                                        <p className="text-xs font-black text-slate-800 mt-2 leading-snug">{m.metadata.question}</p>
                                      </div>
                                      <div className="space-y-2">
                                        {m.metadata.options.map((opt: any) => {
                                          const optVotes = m.metadata.votes?.[opt.id] || [];
                                          const totalVotes = Object.values(m.metadata.votes || {}).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0) as number;
                                          const pct = totalVotes > 0 ? Math.round((optVotes.length / totalVotes) * 100) : 0;
                                          const active = optVotes.includes(user?.id);
                                          return (
                                            <button
                                              key={opt.id}
                                              type="button"
                                              onClick={() => m.id && handleMessageInteraction(m.id, { type: 'vote', optionId: opt.id })}
                                              className={`relative w-full text-left py-2 px-3 rounded-xl border text-xs transition-all duration-200 overflow-hidden cursor-pointer flex justify-between items-center group min-h-[38px] ${
                                                active 
                                                  ? 'bg-blue-50/50 border-[#2563eb] text-[#2563eb] font-bold' 
                                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                              }`}
                                            >
                                              <div 
                                                className={`absolute left-0 top-0 bottom-0 transition-all duration-500 z-0 ${
                                                  active ? 'bg-blue-100/40' : 'bg-slate-100'
                                                }`} 
                                                style={{ width: `${pct}%` }} 
                                              />
                                              <span className="relative z-10 font-bold flex items-center gap-1.5">
                                                {active && <Check className="w-3.5 h-3.5 text-[#2563eb]" />}
                                                {opt.text}
                                              </span>
                                              <span className="relative z-10 text-[10px] font-black text-slate-500 group-hover:text-[#2563eb] transition-colors">{pct}%</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                      <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center text-[8px] text-slate-400 font-extrabold px-0.5">
                                        <span>Click option to vote / toggle</span>
                                        <span>Total: {Object.values(m.metadata.votes || {}).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0) as number} votes</span>
                                      </div>
                                    </div>
                                  ) : m.metadata?.type === 'event' ? (
                                    <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-md min-w-[260px] text-left space-y-3">
                                      <div className="flex gap-2.5 items-start">
                                        <div className="p-2.5 bg-blue-50 text-[#2563eb] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                          <Calendar className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <span className="text-[8px] text-[#2563eb] font-extrabold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full">Calendar Event</span>
                                          <p className="text-xs font-black text-slate-800 mt-1 truncate">{m.metadata.title}</p>
                                          <p className="text-[9px] text-slate-500 font-semibold mt-1">📅 {m.metadata.date} at {m.metadata.time}</p>
                                          <p className="text-[8px] text-slate-400 font-bold truncate mt-0.5">📍 {m.metadata.location}</p>
                                        </div>
                                      </div>
                                      <div className="flex gap-1.5 pt-1.5 border-t border-slate-100">
                                        {[
                                          { key: 'yes', label: 'Going', activeColor: 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 shadow' },
                                          { key: 'maybe', label: 'Maybe', activeColor: 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600 shadow' },
                                          { key: 'no', label: 'Decline', activeColor: 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600 shadow' }
                                        ].map((btn) => {
                                          const list = m.metadata.rsvps?.[btn.key] || [];
                                          const isSelected = list.includes(user?.id);
                                          return (
                                            <button
                                              key={btn.key}
                                              type="button"
                                              onClick={() => m.id && handleMessageInteraction(m.id, { type: 'rsvp', status: btn.key as any })}
                                              className={`flex-1 py-1 px-2.5 rounded-xl border text-[9px] font-black transition-all duration-200 cursor-pointer text-center ${
                                                isSelected 
                                                  ? btn.activeColor 
                                                  : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
                                              }`}
                                            >
                                              {btn.label}
                                            </button>
                                          );
                                        })}
                                      </div>
                                      <div className="flex justify-between items-center text-[8px] text-slate-400 font-extrabold px-0.5">
                                        <span>RSVPs:</span>
                                        <span className="flex gap-1.5">
                                          <span className="text-emerald-600 font-black">Going: {m.metadata.rsvps?.yes?.length || 0}</span>
                                          <span className="text-amber-600 font-black">Maybe: {m.metadata.rsvps?.maybe?.length || 0}</span>
                                        </span>
                                      </div>
                                    </div>
                                  ) : m.metadata?.type === 'gif' ? (
                                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white max-w-[260px] shadow-sm">
                                      <img 
                                        src={m.metadata.gifUrl} 
                                        alt="GIF" 
                                        className="w-full object-cover max-h-[160px]" 
                                      />
                                      <div className="p-1 px-2 bg-slate-50 text-[7px] text-slate-400 font-bold flex justify-between items-center">
                                        <span>Tenor GIF</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      {m.fileUrl && (
                                        <div className="mb-2">
                                          {m.fileType?.startsWith('image/') ? (
                                            <a 
                                              href={m.fileUrl} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="block overflow-hidden rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow"
                                            >
                                              <img 
                                                src={m.fileUrl} 
                                                alt={m.fileName || 'Image attachment'} 
                                                className="max-w-[260px] max-h-[180px] object-cover transition-transform hover:scale-102 duration-300"
                                              />
                                            </a>
                                          ) : m.fileType?.startsWith('audio/') ? (
                                            <div className="flex items-center gap-3 p-3 bg-[#e2f0fd] border border-blue-100 rounded-2xl max-w-[280px]">
                                              <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                                                <Mic className="w-5 h-5" />
                                              </div>
                                              <div className="flex-grow min-w-0">
                                                <audio 
                                                  src={m.fileUrl} 
                                                  controls 
                                                  className="w-full max-w-[185px] h-8 text-xs focus:outline-none custom-audio-player"
                                                />
                                                <div className="flex justify-between items-center mt-1 text-[8px] text-blue-600 font-extrabold px-1">
                                                  <span>Voice Note</span>
                                                  <span>{m.fileSize ? `${(m.fileSize / 1024).toFixed(1)} KB` : ''}</span>
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2.5 p-2.5 bg-white border border-slate-200 rounded-xl max-w-[260px] hover:border-blue-200 transition-colors">
                                              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-[#2563eb] flex-shrink-0">
                                                <FileText className="w-5 h-5" />
                                              </div>
                                              <div className="min-w-0 flex-1 text-left">
                                                <p className="text-[10px] font-bold text-slate-700 truncate" title={m.fileName}>{m.fileName}</p>
                                                <p className="text-[8px] text-slate-400 font-bold mt-0.5">
                                                  {m.fileSize ? `${(m.fileSize / 1024).toFixed(1)} KB` : 'Attachment'}
                                                </p>
                                              </div>
                                              <a 
                                                href={m.fileUrl} 
                                                download={m.fileName}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 hover:bg-slate-150 rounded-lg text-slate-500 hover:text-[#2563eb] transition-colors flex items-center justify-center flex-shrink-0"
                                                title="Download file"
                                              >
                                                <Download className="w-3.5 h-3.5" />
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      <div className="break-words max-w-[320px]">{m.text}</div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {typingUser && (
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold pl-11">
                            <span className="animate-bounce">●</span>
                            <span className="animate-bounce delay-100">●</span>
                            <span className="animate-bounce delay-200">●</span>
                            <span>{typingUser} is typing...</span>
                          </div>
                        )}
                      </div>

                      {/* Chat footer send box (WhatsApp Rich Style) */}
                      <div className="relative pt-4 border-t border-slate-100 bg-white flex-shrink-0">
                        {/* Slide-Up File Preview Card */}
                        {attachedFile && (
                          <div className="absolute bottom-full left-0 right-0 mb-3 p-3 bg-white border border-slate-250 rounded-3xl shadow-xl flex items-center justify-between gap-3 animate-slide-up text-left z-25">
                            <div className="flex items-center gap-3 min-w-0">
                              {attachedFile.localPreviewUrl ? (
                                <img 
                                  src={attachedFile.localPreviewUrl} 
                                  alt="Preview" 
                                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#9333ea] flex-shrink-0">
                                  <FileText className="w-5.5 h-5.5" />
                                </div>
                              )}
                              
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-800 truncate">{attachedFile.fileName}</p>
                                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                  {(attachedFile.fileSize / 1024).toFixed(1)} KB • {attachedFile.fileType.split('/')[1]?.toUpperCase() || 'DOCUMENT'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isUploadingFile ? (
                                <div className="w-5 h-5 rounded-full border-2 border-slate-400 border-t-blue-500 animate-spin"></div>
                              ) : (
                                <button 
                                  type="button" 
                                  onClick={() => setAttachedFile(null)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                  title="Cancel attachment"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* WhatsApp-style Attachment Popover Menu */}
                        {showAttachmentMenu && (
                          <div ref={attachmentMenuRef} className="absolute bottom-full left-0 mb-3 w-[220px] bg-white border border-slate-250 shadow-2xl rounded-3xl p-2.5 flex flex-col gap-1 animate-slide-up z-50 text-left">
                            {[
                              { label: 'Document', color: 'bg-purple-600 text-purple-100', icon: FileText, accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar' },
                              { label: 'Photos & videos', color: 'bg-blue-600 text-blue-100', icon: Image, accept: 'image/*,video/*' },
                              { label: 'Camera', color: 'bg-pink-600 text-pink-100', icon: Camera, action: () => handleOpenCameraModal() },
                              { label: 'Audio', color: 'bg-orange-600 text-orange-100', icon: Music, accept: 'audio/*' },
                              { label: 'Contact', color: 'bg-cyan-600 text-cyan-100', icon: User, action: () => setShowContactModal(true) },
                              { label: 'Poll', color: 'bg-amber-600 text-amber-100', icon: BarChart2, action: () => setShowPollModal(true) },
                              { label: 'Event', color: 'bg-rose-600 text-rose-100', icon: Calendar, action: () => setShowEventModal(true) },
                              { label: 'New sticker', color: 'bg-teal-600 text-teal-100', icon: Plus, action: () => { setShowEmojiPicker(true); setPickerMode('sticker'); } }
                            ].map((item, idx) => {
                              const Icon = item.icon;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    if (item.action) {
                                      item.action();
                                      setShowAttachmentMenu(false);
                                    } else {
                                      triggerFileInput(item.accept);
                                    }
                                  }}
                                  className="flex items-center gap-3 px-2.5 py-2 rounded-2xl hover:bg-slate-50 transition-colors w-full cursor-pointer text-left group"
                                >
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow transition-transform group-hover:scale-105 ${item.color}`}>
                                    <Icon className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-slate-600 text-[11px] font-bold transition-colors group-hover:text-[#2563eb]">
                                    {item.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Custom Emoji Picker Popover */}
                        {showEmojiPicker && (
                          <div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-3 w-[300px] h-[350px] bg-white border border-slate-250 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up text-left z-50">
                            {/* Category tabs (only for Emoji mode) */}
                            {pickerMode === 'emoji' && (
                              <div className="flex justify-between items-center p-2.5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
                                {[
                                  { id: 'all', label: 'All' },
                                  { id: 'smileys', label: '😀' },
                                  { id: 'activities', label: '⚽' },
                                  { id: 'travel', label: '🚗' },
                                  { id: 'objects', label: '💡' },
                                  { id: 'symbols', label: '❤️' }
                                ].map(tab => (
                                  <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setEmojiTab(tab.id as any)}
                                    className={`text-xs p-1.5 rounded-lg transition-colors cursor-pointer bg-transparent border-0 ${
                                      emojiTab === tab.id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    {tab.label}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Search bar */}
                            <div className="p-2.5 bg-slate-50/50 flex-shrink-0">
                              <input
                                type="text"
                                placeholder={
                                  pickerMode === 'emoji' ? "Search emoji..." :
                                  pickerMode === 'gif' ? "Search developer GIFs..." :
                                  "Search developer stickers..."
                                }
                                value={emojiSearch}
                                onChange={(e) => setEmojiSearch(e.target.value)}
                                className="w-full text-[11px] font-semibold px-3 py-2 bg-white border border-slate-250 rounded-xl outline-none text-slate-800 placeholder-slate-400 focus:border-blue-400 text-base"
                              />
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 overflow-y-auto p-2.5 bg-white scrollbar-thin">
                              {pickerMode === 'emoji' ? (
                                <div className="grid grid-cols-6 gap-1">
                                  {EMOJIS
                                    .filter(emoji => {
                                      if (emojiTab !== 'all' && emoji.cat !== emojiTab) return false;
                                      if (emojiSearch && !emoji.name.toLowerCase().includes(emojiSearch.toLowerCase())) return false;
                                      return true;
                                    })
                                    .map((emoji, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setChatText(prev => prev + emoji.char)}
                                        className="text-lg p-1.5 hover:bg-slate-50 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center bg-transparent border-0"
                                        title={emoji.name}
                                      >
                                        {emoji.char}
                                      </button>
                                    ))}
                                  {EMOJIS.filter(emoji => {
                                    if (emojiTab !== 'all' && emoji.cat !== emojiTab) return false;
                                    if (emojiSearch && !emoji.name.toLowerCase().includes(emojiSearch.toLowerCase())) return false;
                                    return true;
                                  }).length === 0 && (
                                    <div className="col-span-6 text-center text-slate-400 text-xs py-8 font-bold">
                                      No emojis found
                                    </div>
                                  )}
                                </div>
                              ) : pickerMode === 'gif' ? (
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { name: 'coding work computer developer', url: 'https://media.giphy.com/media/QJyWq2MABho08/giphy.gif' },
                                    { name: 'error debug facepalm fail', url: 'https://media.giphy.com/media/d2bOZ4zvrpTdBspd/giphy.gif' },
                                    { name: 'it works build deploy celebrate', url: 'https://media.giphy.com/media/26n6R5HO1IIeGC1Ry/giphy.gif' },
                                    { name: 'coffee programmer caffeine code', url: 'https://media.giphy.com/media/3o7qE1YN7aBOFPRw8E/giphy.gif' },
                                    { name: 'hacker typing fast matrix terminal', url: 'https://media.giphy.com/media/13HgwGsXF0aVQA/giphy.gif' },
                                    { name: 'server down fire panic crash', url: 'https://media.giphy.com/media/3o72F8tGPv1A2cHXmo/giphy.gif' },
                                    { name: 'cat typing programmer developer work', url: 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif' },
                                    { name: 'git merge branch pull request happy', url: 'https://media.giphy.com/media/NEvPzZfJ1VglG/giphy.gif' },
                                    { name: 'bugs software testing fixing code', url: 'https://media.giphy.com/media/uz0hy845VjQfC/giphy.gif' },
                                    { name: 'database query drop tables postgres', url: 'https://media.giphy.com/media/3o7bu3XilJ5BOiSGic/giphy.gif' },
                                    { name: 'frontend react css layout align', url: 'https://media.giphy.com/media/13FrpeVHb9bkFA/giphy.gif' },
                                    { name: 'ai robot artificial intelligence deep learning', url: 'https://media.giphy.com/media/IZY2SE2JmPgXA2Ctkq/giphy.gif' }
                                  ]
                                    .filter(g => !emojiSearch || g.name.toLowerCase().includes(emojiSearch.toLowerCase()))
                                    .map((g, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSendGif(g.url)}
                                        className="overflow-hidden rounded-xl border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-slate-50 p-0 flex items-center justify-center"
                                        title={g.name}
                                      >
                                        <img src={g.url} alt="GIF Preview" className="w-full h-20 object-cover" />
                                      </button>
                                    ))}
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { name: 'Bug Hunter', url: 'https://cdn-icons-png.flaticon.com/512/606/606112.png' },
                                    { name: 'Code Monkey', url: 'https://cdn-icons-png.flaticon.com/512/2815/2815428.png' },
                                    { name: 'TypeScript God', url: 'https://cdn-icons-png.flaticon.com/512/919/919832.png' },
                                    { name: 'React Wizard', url: 'https://cdn-icons-png.flaticon.com/512/1126/1126012.png' },
                                    { name: 'Database Boss', url: 'https://cdn-icons-png.flaticon.com/512/4248/4248443.png' },
                                    { name: 'Git Master', url: 'https://cdn-icons-png.flaticon.com/512/4494/4494740.png' },
                                    { name: 'Coffee Fuelled', url: 'https://cdn-icons-png.flaticon.com/512/924/924514.png' },
                                    { name: 'AI Supermind', url: 'https://cdn-icons-png.flaticon.com/512/2103/2103811.png' },
                                    { name: 'Deadline Panic', url: 'https://cdn-icons-png.flaticon.com/512/3256/3256360.png' },
                                    { name: 'Work From Home', url: 'https://cdn-icons-png.flaticon.com/512/3233/3233001.png' }
                                  ]
                                    .filter(s => !emojiSearch || s.name.toLowerCase().includes(emojiSearch.toLowerCase()))
                                    .map((s, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSendSticker(s.url, s.name)}
                                        className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-100 hover:border-pink-300 hover:shadow-md hover:bg-pink-50/20 transition-all cursor-pointer bg-white"
                                        title={s.name}
                                      >
                                        <img src={s.url} alt="Sticker Preview" className="w-10 h-10 object-contain" />
                                        <span className="text-[7px] font-black text-slate-400 mt-1 truncate max-w-full">{s.name}</span>
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>

                            {/* Bottom tabs toggle: Emoji, GIF, Sticker */}
                            <div className="p-2 border-t border-slate-100 bg-slate-50 flex justify-center gap-4 text-[10px] font-black text-slate-500 flex-shrink-0">
                              <button 
                                type="button"
                                onClick={() => { setPickerMode('emoji'); setEmojiSearch(''); }}
                                className={`px-2.5 py-0.5 rounded-full cursor-pointer bg-transparent border-0 ${pickerMode === 'emoji' ? 'bg-emerald-50 text-emerald-600 font-extrabold shadow-sm' : 'hover:text-slate-700'}`}
                              >
                                Emoji
                              </button>
                              <button 
                                type="button"
                                onClick={() => { setPickerMode('gif'); setEmojiSearch(''); }}
                                className={`px-2.5 py-0.5 rounded-full cursor-pointer bg-transparent border-0 ${pickerMode === 'gif' ? 'bg-blue-50 text-blue-600 font-extrabold shadow-sm' : 'hover:text-slate-700'}`}
                              >
                                GIF
                              </button>
                              <button 
                                type="button"
                                onClick={() => { setPickerMode('sticker'); setEmojiSearch(''); }}
                                className={`px-2.5 py-0.5 rounded-full cursor-pointer bg-transparent border-0 ${pickerMode === 'sticker' ? 'bg-pink-50 text-pink-600 font-extrabold shadow-sm' : 'hover:text-slate-700'}`}
                              >
                                Sticker
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Hidden input tags */}
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden text-base"
                        />

                        {/* Main Chat input form */}
                        <form onSubmit={handleSendChat} className="flex gap-2.5 items-center">
                          {isRecording ? (
                            <div className="relative flex items-center flex-1 bg-red-50 border border-red-200 rounded-full px-4 py-3 gap-3 shadow-md justify-between animate-pulse">
                              {/* Recording Blinking indicator */}
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                                <span className="text-xs font-bold text-red-600 flex items-center gap-1">🎙️ Recording voice note:</span>
                                <span className="text-xs font-black text-red-750 bg-red-100 px-2.5 py-0.5 rounded-full">
                                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                                </span>
                              </div>

                              {/* Discard Voice Message Button */}
                              <button
                                type="button"
                                onClick={() => stopVoiceRecording(false)}
                                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-650 hover:text-red-800 text-[10px] font-black rounded-full shadow transition-all cursor-pointer border-0"
                                title="Discard voice note"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="relative flex items-center flex-1 bg-[#f0f2f5] border border-slate-200 rounded-full focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white focus-within:border-blue-400 transition-all duration-300 px-3.5 py-2.5 gap-2 shadow-sm">
                              {/* Colorful WhatsApp Attachment popover trigger */}
                              <button 
                                ref={attachmentButtonRef}
                                type="button" 
                                onClick={() => {
                                  setShowAttachmentMenu(prev => !prev);
                                  setShowEmojiPicker(false);
                                }}
                                className={`p-1 text-slate-500 hover:text-[#2563eb] hover:bg-slate-200 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
                                  showAttachmentMenu ? 'text-[#2563eb] rotate-45 bg-slate-200' : ''
                                }`}
                                title="Add attachment"
                              >
                                <Plus className="w-4.5 h-4.5" />
                              </button>

                              {/* WhatsApp Emoji picker trigger */}
                              <button 
                                ref={emojiButtonRef}
                                type="button"
                                onClick={() => {
                                  setShowEmojiPicker(prev => !prev);
                                  setShowAttachmentMenu(false);
                                }}
                                className={`p-1 text-slate-500 hover:text-[#2563eb] hover:bg-slate-200 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
                                  showEmojiPicker ? 'text-[#2563eb] bg-slate-200' : ''
                                }`}
                                title="Select emoji"
                              >
                                <Smile className="w-4.5 h-4.5" />
                              </button>
                              
                              {/* Text Input */}
                              <input 
                                type="text" 
                                placeholder="Type a message"
                                value={chatText}
                                onChange={(e) => {
                                  setChatText(e.target.value);
                                  if (socket && activeConversationId && user) {
                                    socket.emit('typing', {
                                      roomId: activeConversationId,
                                      name: user.name,
                                      isTyping: e.target.value.length > 0,
                                    });
                                  }
                                }}
                                className="flex-1 text-[12px] font-semibold bg-transparent focus:outline-none border-none outline-none text-slate-800 placeholder-slate-400 py-1 px-1 text-base" 
                              />
                            </div>
                          )}

                          {/* Dynamic Mic/Send Circular floating button */}
                          {isRecording ? (
                            <button 
                              type="button"
                              onClick={() => stopVoiceRecording(true)}
                              className="p-3.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-250 flex items-center justify-center cursor-pointer flex-shrink-0 animate-pulse"
                              title="Send Voice Message"
                            >
                              <Send className="w-4.5 h-4.5 text-white fill-white" />
                            </button>
                          ) : chatText.trim() === '' && !attachedFile ? (
                            <button 
                              type="button"
                              onClick={toggleChatMic}
                              className={`p-3.5 text-slate-600 rounded-full border border-slate-250 hover:bg-slate-100 hover:text-[#2563eb] transition-all duration-250 flex items-center justify-center cursor-pointer flex-shrink-0 bg-slate-50 shadow-sm ${
                                micActive ? 'bg-red-50 text-red-500 border-red-200 animate-pulse' : ''
                              }`}
                              title="Voice Typing"
                            >
                              {micActive ? <MicOff className="w-4.5 h-4.5 text-red-500" /> : <Mic className="w-4.5 h-4.5 text-slate-555" />}
                            </button>
                          ) : (
                            <button 
                              type="submit"
                              disabled={isUploadingFile}
                              className="p-3.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-250 flex items-center justify-center cursor-pointer flex-shrink-0 disabled:opacity-50 disabled:transform-none disabled:scale-100"
                              title="Send message"
                            >
                              <Send className="w-4.5 h-4.5 text-white fill-white" />
                            </button>
                          )}
                        </form>
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: AI Help Tutor Chatbot */}
              {activeTab === 'tutor' && (
                <motion.div 
                  key="tutor"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col flex-1 overflow-hidden w-full h-full min-h-0 bg-slate-50/50"
                >
                  {/* Premium Header Bar */}
                  <div className="px-6 py-4 border-b border-slate-100/80 flex items-center justify-between flex-shrink-0 bg-white/80 backdrop-blur-md shadow-sm z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-150 transform hover:rotate-12 transition-transform duration-300">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-black text-slate-800 text-sm tracking-tight">AI Assistant Engine</h4>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          <Terminal className="w-3.5 h-3.5 text-slate-400" /> System Context & Voice enabled
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={handleClearHistory}
                      className="p-2 bg-slate-50 border border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 text-slate-400 rounded-2xl transition-all duration-200 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                      title="Clear History"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
       
                  {/* Chat Area with beautiful scrollbar and background */}
                  <div className="flex-grow overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-slate-50/40 via-white/20 to-slate-100/10">
                    {state.chatHistory.map((msg, idx) => {
                      const isUser = msg.sender === 'user';
                      return (
                        <div key={idx} className={`flex items-end gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto text-left'} animate-slide-up`}>
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0 shadow-md transform hover:scale-105 transition-transform duration-200
                            ${isUser 
                              ? 'bg-gradient-to-tr from-indigo-500 to-blue-600 shadow-indigo-100' 
                              : 'bg-gradient-to-tr from-slate-700 to-slate-800 shadow-slate-100'}`}>
                            {isUser ? userName.charAt(0).toUpperCase() : "AI"}
                          </div>
                          
                          <div className={`p-4 rounded-3xl text-xs font-semibold leading-relaxed border shadow-sm transition-all duration-200 hover:shadow-md
                            ${isUser 
                              ? 'bg-gradient-to-br from-indigo-600 to-blue-600 border-blue-700 text-white rounded-br-none' 
                              : 'bg-white border-slate-150 text-slate-700 rounded-bl-none'}`}>
                            <div className="whitespace-pre-line">
                              {formatMessageText(msg.text, isUser)}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {isBotTyping && (
                      <div className="flex items-end gap-3 mr-auto text-left max-w-[85%] animate-pulse">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0 shadow-md">AI</div>
                         <div className="bg-white border border-slate-150 p-4 rounded-3xl rounded-bl-none shadow-sm flex items-center gap-1.5 min-w-[60px] justify-center">
                           <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                           <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                           <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                         </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Dynamic suggestions capsules */}
                  <div className="px-6 py-3 border-t border-slate-100/60 overflow-x-auto flex gap-2 flex-shrink-0 bg-white/40 scrollbar-none z-10">
                    {suggestedPrompts.map((p, idx) => (
                      <button 
                        key={idx}
                        onClick={() => { handleSendBotMessage(p); }}
                        className="text-[10px] font-black px-4 py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  {/* Input form in premium container */}
                  <form onSubmit={handleBotFormSubmit} className="p-4 border-t border-slate-100/80 flex items-center gap-3 bg-white/95 backdrop-blur-md flex-shrink-0 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] z-10">
                    <div className="relative flex items-center flex-1 bg-slate-50 border border-slate-200/80 rounded-2xl focus-within:ring-4 focus-within:ring-indigo-50 focus-within:bg-white focus-within:border-indigo-500 transition-all duration-300 px-4 py-2.5 gap-2.5 shadow-sm">
                      {/* Voice Mic Button */}
                      <button 
                        type="button"
                        onClick={toggleMic}
                        className={`p-2 rounded-xl cursor-pointer transition-all duration-200 border flex items-center justify-center shadow-sm ${
                          micActive 
                            ? 'bg-red-500 text-white border-red-500 animate-pulse' 
                            : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200'
                        }`}
                        title="Voice Input"
                      >
                        {micActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>

                      {/* Input tag */}
                      <input 
                        type="text" 
                        value={botInput}
                        onChange={(e) => setBotInput(e.target.value)}
                        placeholder="Ask about tasks, attendance, scores..."
                        className="flex-1 text-xs font-semibold bg-transparent focus:outline-none border-none outline-none text-slate-700 placeholder-slate-400 py-1 text-base"
                      />
                    </div>

                    {/* Circular Floating Send Button */}
                    <button 
                      type="submit"
                      disabled={isBotTyping || !botInput.trim()}
                      className="p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-indigo-350 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:shadow-none disabled:transform-none flex-shrink-0"
                      title="Send message"
                    >
                      <Send className="w-4 h-4 fill-white text-white" />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* TAB 3: Query Helpdesk Tickets */}
              {activeTab === 'tickets' && (
                <motion.div 
                  key="tickets"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-5 flex flex-1 flex-col justify-between overflow-hidden w-full h-full min-h-0"
                >
                  <div className="space-y-4 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center pb-3 border-b flex-wrap gap-2">
                      <h4 className="font-extrabold text-slate-800 text-sm">Query Helpdesk Tickets</h4>
                      <button 
                        onClick={() => setShowAddTicket(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#2563eb] hover:bg-blue-700 text-white text-[10px] font-extrabold rounded-xl shadow cursor-pointer transition-colors border-0"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Raise New Ticket
                      </button>
                    </div>

                    {showAddTicket && (
                      <form onSubmit={handleCreateTicket} className="p-4 bg-slate-50 border rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Category</label>
                          <select 
                            value={ticketCategory}
                            onChange={(e) => setTicketCategory(e.target.value)}
                            className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-base"
                          >
                            <option>Hardware/IT</option>
                            <option>Stipend</option>
                            <option>Leaves</option>
                            <option>Access & Permissions</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Priority</label>
                          <select 
                            value={ticketPriority}
                            onChange={(e) => setTicketPriority(e.target.value)}
                            className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-base"
                          >
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                          </select>
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="font-bold text-slate-600">Query Title / Description</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Describe your issue..."
                              value={ticketTitle}
                              onChange={(e) => setTicketTitle(e.target.value)}
                              className="flex-1 text-xs font-semibold px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-base" 
                            />
                            <button type="submit" className="px-4 py-2 bg-[#2563eb] text-white font-extrabold rounded-xl hover:bg-blue-700 shadow-md cursor-pointer">Create</button>
                          </div>
                        </div>
                      </form>
                    )}

                    {tickets.length === 0 && !showAddTicket ? (
                      <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                          <HelpCircle className="w-7 h-7 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">No tickets yet</p>
                        <p className="text-xs text-slate-400 max-w-sm">When you raise a helpdesk ticket, it will appear here. Click "Raise New Ticket" to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tickets.map(t => (
                          <div key={t.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex justify-between items-center flex-wrap gap-4 text-xs font-semibold hover:border-blue-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-full">{t.id}</span>
                              <span className="text-slate-700">{t.title}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                                t.priority === 'High' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                t.priority === 'Low' ? 'bg-slate-50 text-slate-500 border-slate-200' : 
                                'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>{t.priority}</span>
                              <span className="text-[10px] text-slate-400 font-bold">{t.category}</span>
                              <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${
                                t.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>{t.status}</span>
                              <button 
                                onClick={() => handleRemoveTicket(t.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 cursor-pointer"
                                title="Remove Ticket"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB 4: Discussion Forum */}
              {activeTab === 'forum' && (
                <motion.div 
                  key="forum"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-5 flex flex-1 flex-col justify-between overflow-hidden w-full h-full min-h-0"
                >
                  <div className="space-y-4 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 flex-wrap gap-2">
                      <h4 className="font-extrabold text-slate-800 text-sm">Threaded Discussion Forum</h4>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Search post..."
                            value={forumSearch}
                            onChange={(e) => setForumSearch(e.target.value)}
                            className="text-[11px] font-semibold pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-base"
                          />
                        </div>
                        <button 
                          onClick={() => setShowAddPost(true)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#2563eb] hover:bg-blue-700 text-white text-[10px] font-extrabold rounded-xl shadow cursor-pointer transition-colors border-0"
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> New Post
                        </button>
                      </div>
                    </div>

                    {showAddPost && (
                      <form onSubmit={handleCreatePost} className="p-4 bg-slate-50 border rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Category</label>
                          <select 
                            value={newPostCategory}
                            onChange={(e) => setNewPostCategory(e.target.value)}
                            className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-base"
                          >
                            <option>General</option>
                            <option>Testing</option>
                            <option>TypeScript</option>
                            <option>React</option>
                            <option>Python</option>
                            <option>DevOps</option>
                            <option>Design</option>
                          </select>
                        </div>
                        <div className="md:col-span-3 space-y-1">
                          <label className="font-bold text-slate-600">Discussion Topic</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="What would you like to discuss?"
                              value={newPostTitle}
                              onChange={(e) => setNewPostTitle(e.target.value)}
                              className="flex-1 text-xs font-semibold px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-base" 
                            />
                            <button type="submit" className="px-4 py-2 bg-[#2563eb] text-white font-extrabold rounded-xl hover:bg-blue-700 shadow-md cursor-pointer">Post</button>
                          </div>
                        </div>
                      </form>
                    )}

                    {forumPosts.length === 0 && !showAddPost ? (
                      <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                          <Megaphone className="w-7 h-7 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">No discussions yet</p>
                        <p className="text-xs text-slate-400 max-w-sm">Start a conversation! Click "New Post" to create the first discussion thread.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {forumPosts.filter(p => p.title.toLowerCase().includes(forumSearch.toLowerCase())).map(p => (
                          <div key={p.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs font-semibold hover:border-blue-100 transition-colors">
                            <div className="space-y-1">
                              <span className="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#2563eb]">{p.category}</span>
                              <h5 className="font-extrabold text-slate-800 mt-1">{p.title}</h5>
                              <p className="text-[9px] text-slate-400 font-bold">Author: {p.author}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleForumUpvote(p.id)}
                                className="flex flex-col items-center gap-1 p-2 bg-white border border-slate-150 rounded-xl hover:bg-slate-50 shadow-sm cursor-pointer min-w-[45px]"
                              >
                                <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-extrabold text-[#2563eb]">{p.votes}</span>
                              </button>
                              <button 
                                onClick={() => handleRemovePost(p.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 cursor-pointer shadow-sm border border-slate-150 bg-white"
                                title="Remove Post"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </main>

      {/* MODAL 1: Create Poll Modal */}
      {showPollModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[999] animate-fade-in p-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl w-full max-w-md animate-scale-up text-left space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">📊 Create Workspace Poll</span>
              <button type="button" onClick={() => setShowPollModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg cursor-pointer bg-transparent border-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSendPoll} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Question</label>
                <input 
                  type="text" 
                  required
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="e.g. Which sprint milestone should we tackle next?"
                  className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:bg-white transition-all text-base"
                />
              </div>
              <div className="space-y-2">
                <label className="text-slate-600 font-bold">Options</label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      required={idx < 2}
                      value={opt}
                      onChange={(e) => {
                        const updated = [...pollOptions];
                        updated[idx] = e.target.value;
                        setPollOptions(updated);
                      }}
                      placeholder={`Option ${idx + 1}${idx < 2 ? ' (Required)' : ' (Optional)'}`}
                      className="flex-1 text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:bg-white transition-all text-base"
                    />
                    {pollOptions.length > 2 && (
                      <button 
                        type="button" 
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors bg-transparent border-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button 
                    type="button" 
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="text-[#2563eb] text-[10px] font-black hover:underline cursor-pointer bg-transparent border-none p-0 mt-1 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </button>
                )}
              </div>
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowPollModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer font-bold border-0">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl shadow-md cursor-pointer font-extrabold border-0">Send Poll</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[999] animate-fade-in p-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl w-full max-w-md animate-scale-up text-left space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">📅 Create Workspace Event</span>
              <button type="button" onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg cursor-pointer bg-transparent border-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSendEvent} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Meeting Title</label>
                <input 
                  type="text" 
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Mid-term Review Presentation"
                  className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:bg-white transition-all text-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-600 font-bold">Date</label>
                  <input 
                    type="date" 
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:bg-white transition-all text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-600 font-bold">Time</label>
                  <input 
                    type="time" 
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:bg-white transition-all text-base"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Location / Link</label>
                <input 
                  type="text" 
                  required
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="e.g. Zoom Link or Conference Room B"
                  className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:bg-white transition-all text-base"
                />
              </div>
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowEventModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer font-bold border-0">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl shadow-md cursor-pointer font-extrabold border-0">Send Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Share Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[999] animate-fade-in p-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl w-full max-w-md animate-scale-up text-left space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">👤 Share Cohort Contact</span>
              <button type="button" onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg cursor-pointer bg-transparent border-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
              <div 
                onClick={() => handleShareContact({ id: 'mentor', name: mentorName, email: 'mentor@internflow.com', role: 'Mentor' })}
                className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-2xl cursor-pointer transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-md">
                  {mentorName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <p className="font-black text-slate-800 truncate group-hover:text-[#2563eb] transition-colors">{mentorName}</p>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">Workspace Mentor Badge</p>
                </div>
                <span className="text-[9px] font-extrabold text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded-full uppercase">Share</span>
              </div>

              {interns.map((intern: any) => (
                <div 
                  key={intern.id}
                  onClick={() => handleShareContact({ 
                    id: intern.id, 
                    name: intern.user?.name || 'Intern', 
                    email: intern.user?.email || '', 
                    role: 'Intern',
                    avatarUrl: intern.user?.avatarUrl
                  })}
                  className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-2xl cursor-pointer transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                    {intern.user?.name?.charAt(0) || 'I'}
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-black text-slate-800 truncate group-hover:text-[#2563eb] transition-colors">{intern.user?.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold truncate mt-0.5">{intern.college} • {intern.degree || 'Intern'}</p>
                  </div>
                  <span className="text-[9px] font-extrabold text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded-full uppercase">Share</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Live Camera Capture Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[999] animate-fade-in p-4">
          <div className="bg-white/95 rounded-3xl p-6 border border-white/20 shadow-2xl w-full max-w-lg animate-scale-up text-left space-y-4 relative overflow-hidden backdrop-blur-xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <Camera className="w-5 h-5 text-pink-500" /> Live Workspace Capture
              </span>
              <button 
                type="button" 
                onClick={handleCloseCameraModal} 
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg cursor-pointer bg-transparent border-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera Viewport / Preview */}
            <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden relative flex items-center justify-center border border-slate-850 shadow-inner">
              {!capturedPhoto ? (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="absolute inset-0 pointer-events-none border border-blue-500/20 rounded-2xl flex items-center justify-center">
                    <div className="w-[80%] h-[80%] border border-dashed border-white/20 rounded-xl" />
                  </div>
                </>
              ) : (
                <img 
                  src={capturedPhoto} 
                  alt="Snapshot" 
                  className="w-full h-full object-cover" 
                />
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center pt-2">
              <button 
                type="button" 
                onClick={handleCloseCameraModal} 
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl font-bold border-0 transition-colors cursor-pointer text-xs"
              >
                Close
              </button>

              {!capturedPhoto ? (
                <button 
                  type="button" 
                  onClick={handleCapturePhoto} 
                  className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer border-4 border-white/80"
                  title="Capture photo"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-white/50" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setCapturedPhoto(null)} 
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-xl font-bold border-0 transition-colors cursor-pointer text-xs"
                  >
                    Retake
                  </button>
                  <button 
                    type="button" 
                    onClick={handleAttachCapturedPhoto} 
                    className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-black shadow-md border-0 transition-colors cursor-pointer text-xs"
                  >
                    Attach Photo
                  </button>
                </div>
              )}

              <div className="w-14 h-10 invisible" />
            </div>
          </div>
        </div>
      )}

      {/* Premium WhatsApp-style Delete Message Modal */}
      {showDeleteModal && selectedMsgToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedMsgToDelete(null);
          }}
          title="Delete message?"
        >
          <div className="p-5 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">Are you sure you want to delete this message?</p>
              <p className="text-[10px] text-slate-400 font-semibold italic truncate px-6">
                "{selectedMsgToDelete.text}"
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {/* Option 1: Delete for Everyone */}
              {(selectedMsgToDelete.senderId === user?.id || user?.role === 'hr') && (
                <button
                  type="button"
                  onClick={() => handleDeleteMessage(true)}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-750 text-white text-xs font-black rounded-2xl shadow transition-colors cursor-pointer border-0"
                >
                  Delete for Everyone
                </button>
              )}

              {/* Option 2: Delete for Me */}
              <button
                type="button"
                onClick={() => handleDeleteMessage(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-2xl transition-colors cursor-pointer border-0"
              >
                Delete for Me
              </button>

              {/* Option 3: Cancel */}
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedMsgToDelete(null);
                }}
                className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-black rounded-2xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
