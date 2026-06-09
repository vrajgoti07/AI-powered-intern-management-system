import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../hooks/useApp';
import { useAuth } from '../../hooks/useAuth';
import { ChatSource } from '../../context/AppContext';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { 
  Brain, Send, RefreshCw,
  Mic, MicOff, Terminal, FileText, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useInternByUser, useTasks } from '../../hooks/queries';
import api from '../../services/api';

export const AIChatbot: React.FC = () => {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [selectedSource, setSelectedSource] = useState<ChatSource | null>(null);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const myName = user?.name || "Intern";
  const { data: myInternData } = useInternByUser(user?.id || '');
  const { data: myTasks } = useTasks();
  const mentorName = myInternData?.mentor?.user?.name || 'Not assigned';

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

  // Auto-scroll chat history
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatHistory, isTyping]);

  // Speech Recognition Setup
  useEffect(() => {
    // @ts-expect-error window speech recognition support check
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setMicActive(false);
        toast.success("Voice input captured!");
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // 1. Dispatch User Message
    dispatch({
      type: 'SEND_CHAT_MESSAGE',
      payload: { sender: 'user', text: textToSend.trim() }
    });

    setIsTyping(true);

    try {
      // Prepare history for API (excluding the just-added user message as API takes full history)
      const formattedHistory = state.chatHistory.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      // Build task data to pass to AI service
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          user_role: (user as { role?: string })?.role || 'INTERN',
          intern_id: myInternData?.id,
          attendance: myInternData?.attendance,
          score: myInternData?.score,
          mentor_name: mentorName,
          department: myInternData?.department?.name,
          skills: myInternData?.skills || [],
          status: myInternData?.status,
          tasks: taskData,
        }
      });

      const botResponse = response.data?.data?.reply || response.data?.data?.response || 'I could not process that request.';
      const sources = response.data?.data?.sources || [];

      // Update suggested prompts dynamically from AI response
      const dynamicPrompts = response.data?.data?.suggestedPrompts;
      if (dynamicPrompts && Array.isArray(dynamicPrompts) && dynamicPrompts.length > 0) {
        setDynamicSuggestions(dynamicPrompts);
      }

      dispatch({
        type: 'SEND_CHAT_MESSAGE',
        payload: { sender: 'bot', text: botResponse, sources }
      });
    } catch (error) {
      console.error(error);
      dispatch({
        type: 'SEND_CHAT_MESSAGE',
        payload: { sender: 'bot', text: "I'm currently offline. The AI engine is unavailable." }
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleSendMessage(input);
    setInput('');
  };

  const handleClearHistory = () => {
    dispatch({ type: 'CLEAR_CHAT_HISTORY' });
    toast.success("Chat history cleared!");
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }

    if (!micActive) {
      try {
        recognitionRef.current.start();
        setMicActive(true);
        toast.success("Listening...");
      } catch {
        setMicActive(false);
      }
    } else {
      recognitionRef.current.stop();
      setMicActive(false);
    }
  };

  const defaultPrompts = [
    "When is my next task due?",
    "What is my attendance ratio?",
    "Show my current performance grade",
    "Internship certificate criteria"
  ];

  const suggestedPrompts = dynamicSuggestions.length > 0 ? dynamicSuggestions : defaultPrompts;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="AI Help Desk Chatbot" />

        {/* Chat main layout */}
        <div className="flex-1 p-2 sm:p-6 overflow-hidden flex flex-col max-w-4xl mx-auto w-full">
          
          <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden flex flex-col flex-1 bg-slate-50/50">
            
            {/* Premium Header Bar */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100/80 flex items-center justify-between flex-shrink-0 bg-white/80 backdrop-blur-md shadow-sm z-10">
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
                      {isUser ? myName.charAt(0).toUpperCase() : "AI"}
                    </div>
                    
                    <div className={`p-3 sm:p-4 rounded-3xl text-xs font-semibold leading-relaxed border shadow-sm transition-all duration-200 hover:shadow-md
                      ${isUser 
                        ? 'bg-gradient-to-br from-indigo-600 to-blue-600 border-blue-700 text-white rounded-br-none' 
                        : 'bg-white border-slate-150 text-slate-700 rounded-bl-none'}`}>
                      <div className="whitespace-pre-line">
                        {formatMessageText(msg.text, isUser)}
                      </div>
                      {!isUser && (
                        <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 items-center" data-testid="sources-container">
                          {msg.sources && msg.sources.length > 0 ? (
                            <>
                              <span className="text-[10px] text-slate-400 font-bold mr-1">Sources:</span>
                              {msg.sources.map((src: ChatSource, sIdx: number) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => setSelectedSource(src)}
                                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
                                  data-testid="source-pill"
                                >
                                  <FileText className="w-3 h-3 text-slate-400" />
                                  <span className="max-w-[100px] truncate">{src.source_file}</span>
                                  <span className="text-[9px] bg-slate-200/60 text-slate-500 px-1 rounded font-normal">p. {src.page_number}</span>
                                </button>
                              ))}
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold italic" data-testid="no-references">No references</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
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
            <div className="px-3 sm:px-6 py-3 border-t border-slate-100/60 overflow-x-auto flex gap-2 flex-shrink-0 bg-white/40 scrollbar-none z-10">
              {suggestedPrompts.map((p, idx) => (
                <button 
                  key={idx}
                  onClick={() => { setInput(p); handleSendMessage(p); setInput(''); }}
                  className="text-[10px] font-black px-4 py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input form in premium container */}
            <form onSubmit={handleFormSubmit} className="p-4 border-t border-slate-100/80 flex items-center gap-3 bg-white/95 backdrop-blur-md flex-shrink-0 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] z-10 sticky bottom-0 bg-white">
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
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about tasks, attendance, scores..."
                  className="flex-1 text-base text-xs font-semibold bg-transparent focus:outline-none border-none outline-none text-slate-700 placeholder-slate-400 py-1"
                />
              </div>

              {/* Circular Floating Send Button */}
              <button 
                type="submit"
                disabled={isTyping || !input.trim()}
                className="p-3.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-indigo-350 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:shadow-none disabled:transform-none flex-shrink-0"
                title="Send message"
              >
                <Send className="w-4 h-4 fill-white text-white" />
              </button>
            </form>

          </div>
        </div>
      </main>
      {/* ─── Source Detail Modal ─── */}
      {selectedSource && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" data-testid="source-modal">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 scale-100 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-150 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-black text-slate-800 tracking-tight">Source Reference</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSource(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                aria-label="Close"
                data-testid="close-modal-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-4 text-left flex-1">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Document Name</p>
                <p className="text-xs font-bold text-slate-700 mt-1" data-testid="modal-source-file">{selectedSource.source_file}</p>
              </div>
              
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Page Reference</p>
                <p className="text-xs font-bold text-slate-700 mt-1" data-testid="modal-page-number">Page {selectedSource.page_number}</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Matched Policy Text Chunk</p>
                <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-150 text-xs text-slate-600 font-medium leading-relaxed max-h-[200px] overflow-y-auto italic" data-testid="modal-chunk-text">
                  "{selectedSource.chunk_text}..."
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedSource(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
              {selectedSource.file_url && (
                <a
                  href={selectedSource.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-150 transition-all cursor-pointer flex items-center gap-1.5"
                  data-testid="modal-pdf-link"
                >
                  View Document
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

