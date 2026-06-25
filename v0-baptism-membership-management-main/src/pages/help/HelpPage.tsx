import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  MessageSquare, Search, Send, Plus, ChevronLeft, Loader2
} from 'lucide-react';
import { selectUser } from '@/store/authStore';
import { messageService, Message } from '@/services/messageService';
import { userService } from '@/services/userService';
import { User as UserType } from '@/types';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Conversation {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string, t: (key: string) => string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return t('common.today');
  if (d.toDateString() === yesterday.toDateString()) return t('common.yesterday');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function isSameDay(d1: string, d2: string) {
  return new Date(d1).toDateString() === new Date(d2).toDateString();
}

function roleBadgeColor(role: string) {
  switch (role) {
    case 'ADMIN': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'PASTOR': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'HEAD_OF_RUM': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'HEAD_OF_FIELD': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'HEAD_OF_DISTRICT': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'FIRST_CHURCH_ELDER': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    case 'INSTRUCTOR': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'CANDIDATE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
}

function formatRole(role: string) {
  if (!role) return '';
  return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function HelpPage() {
  const { t } = useTranslation();
  const user = useSelector(selectUser);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recipients, setRecipients] = useState<UserType[]>([]);
  const [userRoleMap, setUserRoleMap] = useState<Record<number, string>>({});

  const [showNewChat, setShowNewChat] = useState(false);
  const [modalRecipient, setModalRecipient] = useState('');
  const [modalSubject, setModalSubject] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [inputText, setInputText] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval>>();

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, scrollToBottom]);

  const loadRecipients = useCallback(async () => {
    try {
      const all = await userService.getAllUsers();
      let data: UserType[] = [];
      if (Array.isArray(all)) {
        data = all;
      } else if (all?.data) {
        if (Array.isArray(all.data)) {
          data = all.data;
        } else if (Array.isArray((all.data as any).data)) {
          data = (all.data as any).data;
        }
      }
      const others = data.filter(u => String(u.id) !== String(user?.id));
      setRecipients(others);
      const roleMap: Record<number, string> = {};
      for (const u of others) {
        roleMap[Number(u.id)] = u.role;
      }
      setUserRoleMap(roleMap);
    } catch {
      /* ignore */
    }
  }, [user]);

  const buildConversations = useCallback((msgs: Message[]) => {
    if (!user) return;
    const currentUserId = Number(user.id);
    const grouped = new Map<number, Message[]>();

    for (const msg of msgs) {
      const otherId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
      if (!grouped.has(otherId)) {
        grouped.set(otherId, []);
      }
      grouped.get(otherId)!.push(msg);
    }

    const convos: Conversation[] = [];
    for (const [uId, convMsgs] of grouped) {
      convMsgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const lastMsg = convMsgs[convMsgs.length - 1];
      const isSender = lastMsg.senderId === currentUserId;
      const otherName = isSender ? lastMsg.receiverName : lastMsg.senderName;
      const otherEmail = isSender ? lastMsg.receiverEmail : lastMsg.senderEmail;
      const unreadCount = convMsgs.filter(
        m => m.receiverId === currentUserId && !m.read
      ).length;

      convos.push({
        userId: uId,
        userName: otherName,
        userEmail: otherEmail,
        userRole: userRoleMap[uId] || '',
        messages: convMsgs,
        lastMessage: lastMsg,
        unreadCount,
      });
    }

    convos.sort((a, b) =>
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
    setConversations(convos);
  }, [user, userRoleMap]);

  const loadAllMessages = useCallback(async () => {
    setLoading(true);
    try {
      const [inbox, sent] = await Promise.all([
        messageService.getInbox(),
        messageService.getSent(),
      ]);
      const all = [
        ...(Array.isArray(inbox) ? inbox : []),
        ...(Array.isArray(sent) ? sent : []),
      ];
      setAllMessages(all);
      buildConversations(all);
    } catch {
      toast.error('Failed to load messages');
    }
    setLoading(false);
  }, [buildConversations]);

  useEffect(() => {
    loadRecipients();
    loadAllMessages();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (allMessages.length > 0) {
      buildConversations(allMessages);
    }
  }, [userRoleMap]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      try {
        const [inbox, sent] = await Promise.all([
          messageService.getInbox(),
          messageService.getSent(),
        ]);
        const all = [
          ...(Array.isArray(inbox) ? inbox : []),
          ...(Array.isArray(sent) ? sent : []),
        ];
        setAllMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const merged = [...prev];
          for (const msg of all) {
            if (!existingIds.has(msg.id)) {
              merged.push(msg);
              existingIds.add(msg.id);
            }
          }
          return merged;
        });
      } catch {
        /* silent */
      }
    }, 30000);
    return () => clearInterval(pollingRef.current);
  }, []);

  const openConversation = useCallback(async (userId: number) => {
    setSelectedUserId(userId);
    setMobileView('chat');
    setChatLoading(true);
    try {
      const msgs = await messageService.getConversation(userId);
      const data = Array.isArray(msgs) ? msgs : [];
      setChatMessages(data);

      if (user) {
        const currentUserId = Number(user.id);
        const unread = data.filter(m => m.receiverId === currentUserId && !m.read);
        for (const msg of unread) {
          try {
            await messageService.markAsRead(msg.id);
          } catch {
            /* ignore */
          }
        }
        if (unread.length > 0) {
          loadAllMessages();
        }
      }
    } catch {
      toast.error('Failed to load conversation');
    }
    setChatLoading(false);
  }, [user, loadAllMessages]);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    openConversation(conv.userId);
  }, [openConversation]);

  const handleSendChat = useCallback(async () => {
    if (!inputText.trim() || !selectedUserId || sendingChat) return;
    setSendingChat(true);
    try {
      await messageService.send(selectedUserId, '', inputText.trim());
      setInputText('');
      await Promise.all([
        openConversation(selectedUserId),
        loadAllMessages(),
      ]);
    } catch {
      toast.error('Failed to send message');
    }
    setSendingChat(false);
  }, [inputText, selectedUserId, sendingChat, openConversation, loadAllMessages]);

  const handleStartNewChat = useCallback(async () => {
    if (!modalRecipient || !modalMessage.trim() || sending) return;
    setSending(true);
    try {
      await messageService.send(Number(modalRecipient), modalSubject, modalMessage.trim());
      toast.success('Message sent');
      const recipientId = Number(modalRecipient);
      setShowNewChat(false);
      setModalRecipient('');
      setModalSubject('');
      setModalMessage('');
      await loadAllMessages();
      await openConversation(recipientId);
    } catch {
      toast.error('Failed to send message');
    }
    setSending(false);
  }, [modalRecipient, modalSubject, modalMessage, sending, loadAllMessages, openConversation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  }, [handleSendChat]);

  const filteredConversations = conversations.filter(conv =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentConv = conversations.find(c => c.userId === selectedUserId);
  const otherUserName = currentConv?.userName
    || (chatMessages.length > 0
      ? (chatMessages[0].senderId === Number(user?.id)
        ? chatMessages[0].receiverName
        : chatMessages[0].senderName)
      : '');
  const otherUserRole = currentConv?.userRole || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="text-primary" size={32} />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('common.helpAndSupport')}</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="flex h-[calc(100vh-220px)] min-h-[500px]">
          {/* Left panel - Conversation list */}
          <div className={`w-[320px] min-w-[320px] border-r border-gray-200 dark:border-slate-700 flex flex-col ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">{t('common.conversations')}</h2>
              <button
                onClick={() => setShowNewChat(true)}
                className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title={t('common.newConversationTitle')}
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="px-4 py-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('common.searchConversations')}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {searchQuery ? t('common.noConversationsFound') : t('common.noConversationsYet')}
                  </p>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <button
                    key={conv.userId}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                      selectedUserId === conv.userId
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold">
                              {conv.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {conv.userName}
                            </p>
                            {conv.userRole && (
                              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium ${roleBadgeColor(conv.userRole)}`}>
                                {formatRole(conv.userRole)}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {conv.lastMessage.content}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-medium px-1">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right panel - Chat view */}
          <div className={`flex-1 flex flex-col ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}>
            {selectedUserId ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                  <button
                    onClick={() => setMobileView('list')}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 md:hidden"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      {(otherUserName || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {otherUserName || t('common.conversation')}
                    </p>
                    {otherUserRole && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${roleBadgeColor(otherUserRole)}`}>
                        {formatRole(otherUserRole)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50 dark:bg-slate-900">
                  {chatLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={24} className="animate-spin text-primary" />
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                      <MessageSquare size={40} className="mb-2 opacity-50" />
                      <p className="text-sm">{t('common.noMessagesYet')}</p>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((msg, idx) => {
                        const isCurrentUser = Number(user?.id) === msg.senderId;
                        const prevMsg = idx > 0 ? chatMessages[idx - 1] : null;
                        const showDateSeparator = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);
                        const isSameSenderAsPrev = prevMsg && (
                          (isCurrentUser && Number(user?.id) === prevMsg.senderId) ||
                          (!isCurrentUser && msg.senderId === prevMsg.senderId)
                        );

                        return (
                          <div key={msg.id}>
                            {showDateSeparator && (
                              <div className="flex items-center justify-center my-4">
                                <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full font-medium">
                                  {formatDate(msg.createdAt, t)}
                                </span>
                              </div>
                            )}
                            <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${
                              isSameSenderAsPrev ? 'mt-0.5' : 'mt-3'
                            }`}>
                              <div className={`max-w-[70%] ${
                                isCurrentUser
                                  ? 'bg-primary text-white rounded-2xl rounded-br-sm'
                                  : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-2xl rounded-bl-sm border border-gray-200 dark:border-slate-600'
                              } px-3.5 py-2`}>
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                <div className={`flex items-center gap-1 mt-1 ${
                                  isCurrentUser ? 'justify-end' : 'justify-start'
                                }`}>
                                  <p className={`text-[10px] ${
                                    isCurrentUser ? 'text-blue-200' : 'text-gray-400'
                                  }`}>
                                    {formatTime(msg.createdAt)}
                                  </p>
                                  {isCurrentUser && msg.read && (
                                    <span className="text-[9px] text-blue-300 font-medium">
                                      ✓ {t('common.readReceipt')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </div>

                <div className="border-t border-gray-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t('common.typeMessage')}
                      rows={1}
                      className="flex-1 px-4 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary max-h-32"
                      style={{ minHeight: '42px' }}
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={!inputText.trim() || sendingChat}
                      className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      {sendingChat ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <MessageSquare size={48} className="mb-3 opacity-50" />
                <p className="text-sm">{t('common.selectConversation')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('common.newConversation')}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('common.to')}
                </label>
                <select
                  value={modalRecipient}
                  onChange={e => setModalRecipient(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">{t('common.selectRecipient')}</option>
                  {recipients.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.fullName} ({r.email}) - {formatRole(r.role)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('common.subjectOptional')}
                </label>
                <input
                  type="text"
                  value={modalSubject}
                  onChange={e => setModalSubject(e.target.value)}
                  placeholder={t('common.whatIsThisAbout')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('common.message')}
                </label>
                <textarea
                  value={modalMessage}
                  onChange={e => setModalMessage(e.target.value)}
                  rows={4}
                  placeholder={t('common.typeYourMessage')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => { setShowNewChat(false); setModalRecipient(''); setModalSubject(''); setModalMessage(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleStartNewChat}
                disabled={sending || !modalRecipient || !modalMessage.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {t('common.startChat')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
