import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award, Search, CheckCircle, Clock, ChevronDown, ChevronUp,
  Download, User, MapPin, Calendar, Mail, Pen, FileText, AlertCircle
} from 'lucide-react';
import { certificateService } from '@/services/certificateService';
import signatureService from '@/services/signatureService';
import Card from '@/components/ui/Card';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function HeadOfDistrictCertificatesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; variant: 'danger' | 'warning' }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    signatureService.getMySignature()
      .then((data) => setHasSignature(data.hasSignature))
      .catch(() => {});
  }, []);

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['all-baptized-certificates'],
    queryFn: () => certificateService.getAllBaptized(),
  });

  const signMutation = useMutation({
    mutationFn: (baptismId: string) => certificateService.signCertificate(baptismId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-baptized-certificates'] });
      toast.success('Certificate signed successfully!');
    },
    onError: () => toast.error('Failed to sign certificate'),
  });

  const filtered = (certificates as any[]).filter((c: any) =>
    c.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
    c.certificateNumber?.toLowerCase().includes(search.toLowerCase()) ||
    c.candidateEmail?.toLowerCase().includes(search.toLowerCase())
  );

  const signedCount = (certificates as any[]).filter((c: any) => c.certificateSigned).length;
  const unsignedCount = (certificates as any[]).filter((c: any) => !c.certificateSigned).length;

  const handleDownload = async (baptismId: string) => {
    try {
      await certificateService.downloadCertificateFile(baptismId);
      toast.success('Certificate downloaded');
    } catch {
      toast.error('Failed to download certificate');
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Award size={32} className="text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Certificate Management</h1>
            <p className="text-slate-500 dark:text-slate-400">Review and sign baptism certificates</p>
          </div>
        </div>
      </div>

      {!hasSignature && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">
            You need to add your signature before signing certificates.{' '}
            <Link to="/signature" className="font-semibold underline hover:text-amber-900">
              Add your signature
            </Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Certificates</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{certificates.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Signed</p>
              <p className="text-2xl font-bold text-green-600">{signedCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Clock size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Awaiting Signature</p>
              <p className="text-2xl font-bold text-amber-600">{unsignedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or certificate number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-slate-500">
            <Award size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg">No baptized candidates found</p>
            <p className="text-sm">Certificates will appear here once candidates are baptized.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((cert: any) => {
            const isExpanded = expandedId === cert.id;
            return (
              <Card key={cert.id}>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : cert.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      cert.certificateSigned
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      <User size={24} className={cert.certificateSigned ? 'text-green-600' : 'text-amber-600'} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{cert.candidateName}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail size={12} /> {cert.candidateEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {cert.baptismDate ? new Date(cert.baptismDate).toLocaleDateString() : '—'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {cert.location || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {cert.certificateSigned ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
                        <CheckCircle size={12} /> Signed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                        <Clock size={12} /> Pending
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">Certificate Details</h4>
                        <div className="text-sm space-y-1">
                          <p><span className="text-slate-500">Certificate No:</span> <span className="font-mono font-medium">{cert.certificateNumber || '—'}</span></p>
                          <p><span className="text-slate-500">Officiating Pastor:</span> {cert.officiatingPastor || '—'}</p>
                          <p><span className="text-slate-500">Baptism Date:</span> {cert.baptismDate ? new Date(cert.baptismDate).toLocaleDateString() : '—'}</p>
                          <p><span className="text-slate-500">Location:</span> {cert.location || '—'}</p>
                          {cert.witnessName && <p><span className="text-slate-500">Witness:</span> {cert.witnessName}</p>}
                          {cert.sponsorName && <p><span className="text-slate-500">Sponsor:</span> {cert.sponsorName}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">Status</h4>
                        <div className="text-sm space-y-1">
                          <p><span className="text-slate-500">Candidate:</span> {cert.candidateName}</p>
                          <p><span className="text-slate-500">Email:</span> {cert.candidateEmail}</p>
                          <p><span className="text-slate-500">Baptized:</span> {cert.baptized ? 'Yes' : 'No'}</p>
                          <p><span className="text-slate-500">Certificate Signed:</span> {cert.certificateSigned ? 'Yes' : 'No'}</p>
                          {cert.signedAt && <p><span className="text-slate-500">Signed At:</span> {new Date(cert.signedAt).toLocaleString()}</p>}
                          {cert.confirmedAt && <p><span className="text-slate-500">Confirmed At:</span> {new Date(cert.confirmedAt).toLocaleString()}</p>}
                          <p>
                            <span className="text-slate-500">Photo Status:</span>{' '}
                            <span className={cert.profilePicturePath && cert.profilePicturePath !== '' ? 'text-green-600' : 'text-red-600'}>
                              {cert.profilePicturePath && cert.profilePicturePath !== '' ? 'Uploaded' : 'Missing'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => handleDownload(cert.id)}
                        className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                      >
                        <Download size={16} /> Download PDF
                      </button>

                      {!cert.certificateSigned && (
                        <>
                          {!hasSignature ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg text-sm">
                                <AlertCircle size={16} />
                                <span>You must add your signature before signing certificates.</span>
                              </div>
                              <button
                                disabled
                                className="flex items-center gap-2 bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                              >
                                <Pen size={16} /> Sign Certificate
                              </button>
                            </div>
                          ) : (!cert.profilePicturePath || cert.profilePicturePath === '') ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg text-sm">
                                <AlertCircle size={16} />
                                <span>Candidate has no profile picture. Certificate cannot be signed until a photo is uploaded.</span>
                              </div>
                              <button
                                disabled
                                className="flex items-center gap-2 bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                              >
                                <Pen size={16} /> Sign Certificate
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Sign Certificate',
                                  message: 'This will digitally sign and finalize the certificate. Are you sure?',
                                  variant: 'warning',
                                  onConfirm: () => {
                                    signMutation.mutate(cert.id);
                                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                  },
                                });
                              }}
                              disabled={signMutation.isPending}
                              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              <Pen size={16} /> {signMutation.isPending ? 'Signing...' : 'Sign Certificate'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} variant={confirmDialog.variant} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
}
