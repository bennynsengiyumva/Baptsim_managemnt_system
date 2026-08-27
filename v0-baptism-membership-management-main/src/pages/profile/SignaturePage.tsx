import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Trash2, Loader2 } from 'lucide-react';
import SignaturePad from '../../components/ui/SignaturePad';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import signatureService from '../../services/signatureService';
import toast from 'react-hot-toast';

export default function SignaturePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadSignature();
  }, []);

  const loadSignature = async () => {
    try {
      const data = await signatureService.getMySignature();
      if (data.hasSignature && data.signature) {
        setSignature(data.signature);
      }
    } catch (error) {
      console.error('Failed to load signature:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (dataUrl: string) => {
    setSaving(true);
    try {
      await signatureService.saveDrawnSignature(dataUrl);
      setSignature(dataUrl);
      toast.success(t('signature.saved', 'Signature saved successfully'));
    } catch (error) {
      toast.error(t('signature.saveFailed', 'Failed to save signature'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await signatureService.deleteSignature();
      setSignature(null);
      toast.success(t('signature.deleted', 'Signature deleted'));
      setShowDeleteConfirm(false);
    } catch (error) {
      toast.error(t('signature.deleteFailed', 'Failed to delete signature'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('signature.title', 'My Signature')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t('signature.subtitle', 'Draw or upload your signature for certificates')}
          </p>
        </div>
      </div>

      {/* Current Signature Preview */}
      {signature && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {t('signature.currentSignature', 'Current Signature')}
            </h3>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
              <CheckCircle size={16} />
              {t('signature.onFile', 'On file')}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200 mb-4">
            <img src={signature} alt="Your signature" className="max-h-32 mx-auto" />
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
          >
            <Trash2 size={16} />
            {t('signature.removeSignature', 'Remove Signature')}
          </button>
        </div>
      )}

      {/* Signature Pad */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          {signature ? t('signature.updateSignature', 'Update Signature') : t('signature.addSignature', 'Add Your Signature')}
        </h3>
        {saving ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-indigo-600" />
            <span className="ml-3 text-slate-500">{t('common.saving', 'Saving...')}</span>
          </div>
        ) : (
          <SignaturePad onSave={handleSave} existingSignature={signature} />
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={t('signature.removeConfirmTitle', 'Remove Signature?')}
        message={t('signature.removeConfirmMessage', 'This will remove your signature. You will need to add it again before signing certificates.')}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
