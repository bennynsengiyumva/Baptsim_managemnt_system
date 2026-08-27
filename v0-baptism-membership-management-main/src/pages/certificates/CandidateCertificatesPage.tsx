import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Award, Download, CheckCircle, Clock, FileText, Eye, Calendar,
  MapPin, User, Mail, AlertCircle, Shield
} from 'lucide-react';
import { certificateService } from '@/services/certificateService';
import { baptismService } from '@/services/baptismService';
import { candidateService } from '@/services/candidateService';
import { selectUser } from '@/store/authStore';
import Card from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function CandidateCertificatesPage() {
  const { t } = useTranslation();
  const currentUser = useSelector(selectUser);
  const [candidateId, setCandidateId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.email) {
      candidateService.getCandidatesByEmail(currentUser.email).then((res: any) => {
        const list = Array.isArray(res) ? res : [];
        if (list.length > 0) setCandidateId(String(list[0].id));
      });
    }
  }, [currentUser]);

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['candidate-certificates', candidateId],
    queryFn: () => baptismService.getByCandidate(candidateId!),
    enabled: !!candidateId,
  });

  const baptizedCerts = (certificates as any[]).filter((c: any) => c.baptized);

  const handleDownload = async (baptismId: string) => {
    try {
      await certificateService.downloadCertificateFile(baptismId);
      toast.success('Certificate downloaded');
    } catch {
      toast.error('Failed to download certificate');
    }
  };

  const handlePreview = async (baptismId: string) => {
    try {
      await certificateService.previewCertificate(baptismId);
    } catch {
      toast.error('Failed to preview certificate');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Award size={32} className="text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('candidateCertificates.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('candidateCertificates.subtitle')}</p>
        </div>
      </div>

      {baptizedCerts.length === 0 ? (
        <Card>
          <div className="text-center py-16 text-slate-500">
            <Award size={56} className="mx-auto mb-4 text-slate-300" />
            <p className="text-xl font-medium mb-2">{t('candidateCertificates.noCertificates')}</p>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              {t('candidateCertificates.noCertificatesDesc')}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {baptizedCerts.map((cert: any) => {
            const isSigned = cert.certificateSigned === true;
            const isPending = cert.baptized && !isSigned;

            return (
              <Card key={cert.id}>
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isSigned
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-amber-100 dark:bg-amber-900/30'
                  }`}>
                    <FileText size={32} className={isSigned ? 'text-green-600' : 'text-amber-600'} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {t('candidateCertificates.baptismCertificate')}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Certificate No: <span className="font-mono font-semibold text-indigo-600">{cert.certificateNumber || 'Pending'}</span>
                        </p>
                      </div>
                      <div>
                        {isSigned ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                            <CheckCircle size={14} /> {t('candidateCertificates.signedAvailable')}
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full">
                            <Clock size={14} /> {t('candidateCertificates.pendingSignature')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                            <Clock size={14} /> {t('candidateCertificates.processing')}
                          </span>
                        )}
                      </div>
                    </div>

                    {isPending && (
                      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">
                              Your certificate is being reviewed
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                              It will be available for download after the Head of District signs it. You will be notified once it is ready.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        <span>{cert.baptismDate ? new Date(cert.baptismDate).toLocaleDateString() : '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin size={14} className="text-slate-400" />
                        <span>{cert.location || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <User size={14} className="text-slate-400" />
                        <span>{cert.officiatingPastor || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        <span>{cert.candidateEmail || '—'}</span>
                      </div>
                    </div>

                    {cert.signedAt && (
                      <p className="mt-2 text-xs text-slate-400">
                        Signed on {new Date(cert.signedAt).toLocaleString()}
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-3">
                      {isSigned ? (
                        <>
                          <button
                            onClick={() => handlePreview(cert.id)}
                            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                          >
                            <Eye size={16} /> {t('candidateCertificates.viewCertificate')}
                          </button>
                          <button
                            onClick={() => handleDownload(cert.id)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                          >
                            <Download size={16} /> {t('candidateCertificates.downloadPdf')}
                          </button>
                        </>
                      ) : isPending ? (
                        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                          <Shield size={16} />
                          <span className="italic">
                            Certificate will be available after Head of District signature
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">
                          Your certificate is being prepared. You will be notified when it is ready.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
