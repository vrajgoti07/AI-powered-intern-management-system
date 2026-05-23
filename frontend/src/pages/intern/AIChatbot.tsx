import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../hooks/useApp';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { Avatar } from '../../components/common/Avatar';
import { 
  Brain, Send, RefreshCw,
  Mic, MicOff, Terminal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useInternByUser } from '../../hooks/queries';
import api from '../../services/api';

export const AIChatbot: React.FC = () => {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const myName = user?.name || "Intern";
  const { data: myInternData } = useInternByUser(user?.id || '');

  // Auto-scroll chat history
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatHistory, isTyping]);

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
        setInput(transcript);
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

      const response = await api.post('/ai/chatbot', {
        message: textToSend.trim(),
        history: formattedHistory,
        context: {
          user_name: user?.name,
          intern_id: myInternData?.id,
          attendance: myInternData?.attendance,
          score: myInternData?.score
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
      } catch (e) {
        setMicActive(false);
      }
    } else {
      recognitionRef.current.stop();
      setMicActive(false);
    }
  };

  const suggestedPrompts = [
    "When is my next task due?",
    "What is my attendance ratio?",
    "Show my current performance grade",
    "Internship certificate criteria"
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} title="AI Help Desk Chatbot" />

        {/* Chat main layout */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col max-w-4xl mx-auto w-full">
          
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1">
            
            {/* Header info */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8.5 h-8.5 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
                  <Brain className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="text-left">
                  <h4 className="font-extrabold text-slate-800 text-xs tracking-tight">AI Assistant Engine</h4>
                  <p className="text-[9px] text-slate-400 font-semibold flex items-center gap-1"><Terminal className="w-3 h-3" /> Voice & Prompt enabled</p>
                </div>
              </div>
              <button 
                onClick={handleClearHistory}
                className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear history"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
 
            {/* Chat board messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {state.chatHistory.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={idx} className={`flex items-start gap-2.5 max-w-[80%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto text-left'}`}>
                    <Avatar name={isUser ? myName : "AI Bot"} />
                    <div className={`p-4 rounded-3xl text-xs font-semibold leading-relaxed border shadow-sm
                      ${isUser 
                        ? 'bg-indigo-600 border-indigo-700 text-white rounded-tr-none' 
                        : 'bg-slate-50 border-slate-200/50 text-slate-700 rounded-tl-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-start gap-2.5 mr-auto text-left max-w-[80%]">
                  <Avatar name="AI Bot" />
                  <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-3xl rounded-tl-none text-xs text-slate-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Prompt suggestions row */}
            <div className="px-5 py-3 border-t border-slate-100 overflow-x-auto flex gap-2 flex-shrink-0">
              {suggestedPrompts.map((p, idx) => (
                <button 
                  key={idx}
                  onClick={() => { setInput(p); handleSendMessage(p); setInput(''); }}
                  className="text-[9px] font-bold px-3 py-1.5 bg-slate-50 border hover:bg-indigo-50 hover:border-indigo-200 text-slate-500 hover:text-indigo-600 rounded-full transition-colors whitespace-nowrap cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Chat input form */}
            <form onSubmit={handleFormSubmit} className="p-4 border-t border-slate-100 flex items-center gap-3 bg-slate-50/50 flex-shrink-0">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about tasks, attendance, scores..."
                className="flex-1 text-xs font-semibold px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              <button 
                type="button"
                onClick={toggleMic}
                className={`p-3 rounded-2xl shadow-md cursor-pointer transition-colors border ${
                  micActive ? 'bg-red-50 text-red-500 border-red-200 animate-pulse' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {micActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button 
                type="submit"
                disabled={isTyping || !input.trim()}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4 fill-white text-white" />
              </button>
            </form>

          </div>
        </div>
      </main>
    </div>
  );
};
