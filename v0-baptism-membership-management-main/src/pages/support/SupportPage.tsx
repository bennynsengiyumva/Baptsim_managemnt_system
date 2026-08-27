import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Headphones, Send, Loader2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { supportRequestService } from '../../services/supportRequestService';

export default function SupportPage() {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error(t('support.fillAll', 'Please fill in all fields'));
      return;
    }
    setSending(true);
    try {
      await supportRequestService.create({ subject, message });
      toast.success(t('support.sent', 'Support request sent successfully'));
      setSubject('');
      setMessage('');
    } catch (error) {
      toast.error(t('support.failed', 'Failed to send support request'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
          <Headphones size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('support.title', 'Support Center')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('support.subtitle', 'Get help from the administration')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('support.subject', 'Subject')}</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              placeholder={t('support.subjectPlaceholder', 'Brief description of your issue')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('support.message', 'Message')}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              placeholder={t('support.messagePlaceholder', 'Describe your issue in detail...')}
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? t('common.sending', 'Sending...') : t('support.submit', 'Send Request')}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <MessageSquare size={18} />
          {t('support.faqTitle', 'Frequently Asked Questions')}
        </h3>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-white">{t('support.faq1Q', 'How do I reset my password?')}</p>
            <p>{t('support.faq1A', 'Go to the login page and click "Forgot Password". Follow the instructions sent to your email.')}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-white">{t('support.faq2Q', 'How do I upload a profile picture?')}</p>
            <p>{t('support.faq2A', 'Go to your Profile page and click on the avatar to upload a new picture.')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
