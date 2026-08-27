import { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, History, ArrowLeft, X, Clock, Mail, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiAssistantService } from '@/services/aiAssistantService';
import { AiChat, AiChatMessage, HumanSupportMessage } from '@/types';
import Card from '@/components/ui/Card';
import toast from 'react-hot-toast';

type ChatView = 'chat' | 'history' | 'support-history';

export default function AiAssistantPage() {
  const queryClient = useQueryClient();

  const [view, setView] = useState<ChatView>('chat');
  const [currentChat, setCurrentChat] = useState<AiChat | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [showSatisfaction, setShowSatisfaction] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationRole, setEscalationRole] = useState('');
  const [escalationSubject, setEscalationSubject] = useState('');
  const [escalationMessage, setEscalationMessage] = useState('');
  const [selectedHistoryChat, setSelectedHistoryChat] = useState<AiChat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [currentChat?.messages]);

  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, message }: { chatId: number | null; message: string }) =>
      aiAssistantService.sendMessage(chatId, message),
    onSuccess: (chat) => {
      setCurrentChat(chat);
      setShowSatisfaction(true);
      setShowEscalation(false);
    },
    onError: () => {
      toast.error('Failed to get response. Please try again or contact someone.');
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ chatId, satisfied }: { chatId: number; satisfied: boolean }) =>
      aiAssistantService.sendFeedback(chatId, satisfied),
    onSuccess: (_, variables) => {
      if (variables.satisfied) {
        toast.success('Glad I could help!');
        setShowSatisfaction(false);
        queryClient.invalidateQueries({ queryKey: ['ai-chat-history'] });
      } else {
        setShowSatisfaction(false);
        setShowEscalation(true);
        const lastUserMsg = currentChat?.messages?.filter(m => m.role === 'user').pop();
        if (lastUserMsg) {
          setEscalationSubject(lastUserMsg.content.substring(0, 80));
          setEscalationMessage(lastUserMsg.content);
        }
      }
    },
  });

  const escalateMutation = useMutation({
    mutationFn: () => aiAssistantService.escalate(
      currentChat!.id, escalationRole, escalationSubject, escalationMessage
    ),
    onSuccess: () => {
      toast.success('Message sent successfully!');
      setShowEscalation(false);
      setEscalationRole('');
      setEscalationSubject('');
      setEscalationMessage('');
      queryClient.invalidateQueries({ queryKey: ['ai-support-history'] });
    },
  });

  const { data: chatHistory = [] } = useQuery({
    queryKey: ['ai-chat-history'],
    queryFn: () => aiAssistantService.getChatHistory(),
    enabled: view === 'history',
  });

  const { data: supportHistory = [] } = useQuery({
    queryKey: ['ai-support-history'],
    queryFn: () => aiAssistantService.getSupportHistory(),
    enabled: view === 'support-history',
  });

  const handleSend = async () => {
    if (!inputMessage.trim() || sendMessageMutation.isPending) return;
    const message = inputMessage.trim();
    setInputMessage('');
    setShowSatisfaction(false);
    setShowEscalation(false);

    try {
      if (!currentChat) {
        const chat = await aiAssistantService.startChat();
        setCurrentChat(chat);
        const response = await aiAssistantService.sendMessage(chat.id, message);
        setCurrentChat(response);
        setShowSatisfaction(true);
      } else {
        sendMessageMutation.mutate({ chatId: currentChat.id, message });
      }
    } catch {
      toast.error('Failed to get response. Please try again or contact someone.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setCurrentChat(null);
    setShowSatisfaction(false);
    setShowEscalation(false);
    setView('chat');
    setSelectedHistoryChat(null);
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      INSTRUCTOR: 'bg-blue-100 text-blue-800',
      FIRST_CHURCH_ELDER: 'bg-green-100 text-green-800',
      PASTOR: 'bg-purple-100 text-purple-800',
    };
    return colors[role] || 'bg-slate-100 text-slate-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'READ': return <CheckCircle size={14} className="text-green-500" />;
      case 'DELIVERED': return <Mail size={14} className="text-blue-500" />;
      default: return <Clock size={14} className="text-slate-400" />;
    }
  };

  const displayChat = selectedHistoryChat || currentChat;
  const displayMessages = displayChat?.messages || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Assistant</h1>
            <p className="text-sm text-slate-500">Ask me anything about the system</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setView('chat'); setSelectedHistoryChat(null); }}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'chat' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            <Bot size={16} className="inline mr-1" /> Chat
          </button>
          <button
            onClick={() => setView('history')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'history' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            <History size={16} className="inline mr-1" /> History
          </button>
          <button
            onClick={() => setView('support-history')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'support-history' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            <Mail size={16} className="inline mr-1" /> Support
          </button>
        </div>
      </div>

      {/* Chat View */}
      {view === 'chat' && (
        <Card>
          <div className="flex flex-col h-[600px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {displayMessages.length === 0 && !sendMessageMutation.isPending && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bot size={32} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">How can I help you?</h3>
                  <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                    I can help with courses, baptism, certificates, grades, and more.
                    Ask me anything or choose a common question below.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                    {[
                      'How do I complete a lesson?',
                      'How do I request baptism?',
                      'How do I download my certificate?',
                      'How do I check my grades?',
                      'What is my current progress?',
                      'What are the membership requirements?',
                      'How do I update my profile?',
                      'What events are coming up?',
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setInputMessage(q); }}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {sendMessageMutation.isPending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}

              {displayMessages.map((msg: AiChatMessage) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                      : 'bg-slate-200 dark:bg-slate-600'
                  }`}>
                    {msg.role === 'assistant'
                      ? <Bot size={16} className="text-white" />
                      : <User size={16} className="text-slate-600 dark:text-slate-300" />
                    }
                  </div>
                  <div className={`max-w-[75%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{formatTime(msg.createdAt)}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Satisfaction Prompt */}
            {showSatisfaction && currentChat && !showEscalation && (
              <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-t border-indigo-200 dark:border-indigo-800">
                <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2">Did this answer your question?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => feedbackMutation.mutate({ chatId: currentChat.id, satisfied: true })}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => feedbackMutation.mutate({ chatId: currentChat.id, satisfied: false })}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                  >
                    No, Contact Someone
                  </button>
                </div>
              </div>
            )}

            {/* Escalation Form */}
            {showEscalation && (
              <div className="px-4 py-4 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-amber-800 dark:text-amber-300">Contact Someone</h4>
                  <button onClick={() => setShowEscalation(false)} className="text-amber-600 hover:text-amber-800">
                    <X size={16} />
                  </button>
                </div>

                {!escalationRole ? (
                  <div className="space-y-2">
                    <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">Who would you like to contact?</p>
                    {[
                      { role: 'INSTRUCTOR', label: 'Instructor', desc: 'Your assigned course instructor' },
                      { role: 'FIRST_CHURCH_ELDER', label: 'First Church Elder', desc: 'Church elder for guidance' },
                      { role: 'PASTOR', label: 'Pastor', desc: 'Senior church pastor' },
                    ].map((opt) => (
                      <button
                        key={opt.role}
                        onClick={() => setEscalationRole(opt.role)}
                        className="w-full text-left p-3 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-700 hover:border-amber-400 transition-colors"
                      >
                        <p className="font-medium text-sm">{opt.label}</p>
                        <p className="text-xs text-slate-500">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-amber-800 dark:text-amber-300">Subject</label>
                      <input
                        value={escalationSubject}
                        onChange={(e) => setEscalationSubject(e.target.value)}
                        placeholder="e.g. Question About Lesson 7"
                        className="w-full border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 text-sm dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-amber-800 dark:text-amber-300">Message</label>
                      <textarea
                        value={escalationMessage}
                        onChange={(e) => setEscalationMessage(e.target.value)}
                        rows={3}
                        placeholder="Describe your question or issue..."
                        className="w-full border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 text-sm dark:bg-slate-800"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEscalationRole(''); setEscalationSubject(''); setEscalationMessage(''); }}
                        className="px-3 py-2 border border-amber-300 rounded-lg text-sm text-amber-700 hover:bg-amber-100"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => escalateMutation.mutate()}
                        disabled={!escalationSubject.trim() || !escalationMessage.trim() || escalateMutation.isPending}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
                      >
                        {escalateMutation.isPending ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  className="flex-1 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800"
                  disabled={sendMessageMutation.isPending}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                  className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <button
                  onClick={handleNewChat}
                  className="text-xs text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  + New Conversation
                </button>
                {currentChat && (
                  <button
                    onClick={() => setView('history')}
                    className="text-xs text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
                  >
                    <History size={12} /> View History
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Chat History View */}
      {view === 'history' && (
        <div className="space-y-4">
          {selectedHistoryChat ? (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setSelectedHistoryChat(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h3 className="font-semibold">{selectedHistoryChat.title}</h3>
                  <p className="text-xs text-slate-500">{formatDate(selectedHistoryChat.createdAt)} · {selectedHistoryChat.messageCount} messages</p>
                </div>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {selectedHistoryChat.messages.map((msg: AiChatMessage) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'assistant' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-slate-200 dark:bg-slate-600'
                    }`}>
                      {msg.role === 'assistant' ? <Bot size={14} className="text-white" /> : <User size={14} className="text-slate-600" />}
                    </div>
                    <div className={`max-w-[75%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-sm'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{formatTime(msg.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <>
              {chatHistory.length === 0 ? (
                <Card>
                  <div className="text-center py-12">
                    <History size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">No conversation history yet</p>
                    <button
                      onClick={() => setView('chat')}
                      className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      Start a conversation
                    </button>
                  </div>
                </Card>
              ) : (
                <div className="space-y-3">
                  {chatHistory.map((chat) => (
                    <Card key={chat.id}>
                      <button
                        onClick={() => setSelectedHistoryChat(chat)}
                        className="w-full text-left flex items-center justify-between hover:opacity-80 transition-opacity"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Bot size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{chat.title}</p>
                            <p className="text-xs text-slate-500">{formatRelativeTime(chat.createdAt)} · {chat.messageCount} messages</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${chat.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {chat.status}
                          </span>
                          <ArrowLeft size={16} className="text-slate-400 rotate-90" />
                        </div>
                      </button>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Support History View */}
      {view === 'support-history' && (
        <div className="space-y-4">
          {supportHistory.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Mail size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No support messages yet</p>
                <button
                  onClick={() => setView('chat')}
                  className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Start a conversation
                </button>
              </div>
            </Card>
          ) : (
            supportHistory.map((msg: HumanSupportMessage) => (
              <Card key={msg.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                      {getStatusIcon(msg.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{msg.recipientName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadge(msg.recipientRole)}`}>
                          {msg.recipientRole.replace('FIRST_CHURCH_', '')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{msg.subject}</p>
                      <p className="text-sm text-slate-500 mt-1">{msg.message}</p>
                      <p className="text-xs text-slate-400 mt-2">{formatRelativeTime(msg.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    msg.status === 'RESPONDED' ? 'bg-green-100 text-green-700' :
                    msg.status === 'WAITING_FOR_RESPONSE' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {msg.status}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
