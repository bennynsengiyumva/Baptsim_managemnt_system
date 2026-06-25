import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Building2, MapPin, Phone, Mail, User,
  Users, GraduationCap, Award, Edit, Trash2, Loader2
} from 'lucide-react';
import { churchService } from '@/services/churchService';
import { selectUser } from '@/store/authStore';
import { ChurchDetail } from '@/types';
import toast from 'react-hot-toast';

export default function ChurchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);
  const { t } = useTranslation();
  const isAdmin = currentUser?.role === 'ADMIN';

  const { data: detail, isLoading, error } = useQuery<ChurchDetail>({
    queryKey: ['church-detail', id],
    queryFn: () => churchService.getChurchDetail(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (error) toast.error('Failed to load church details');
  }, [error]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-16">
        <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">{t('common.churchNotFound')}</h2>
        <button onClick={() => navigate('/church')} className="mt-4 text-primary hover:underline">{t('common.backToChurches')}</button>
      </div>
    );
  }

  const { church, elders, instructor, candidates, progress } = detail;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <button onClick={() => navigate('/church')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4">
          <ArrowLeft size={16} /> {t('common.backToChurches')}
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 size={24} className="text-primary" />
              {church.churchName}
            </h1>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
              {church.districtName && <span className="flex items-center gap-1"><MapPin size={14} /> {church.districtName} District</span>}
              {church.fieldName && <span>{church.fieldName} Field</span>}
              {church.unionName && <span>{church.unionName} Union</span>}
              {church.phone && <span className="flex items-center gap-1"><Phone size={14} /> {church.phone}</span>}
              {church.email && <span className="flex items-center gap-1"><Mail size={14} /> {church.email}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <button onClick={() => navigate(`/church/${id}/edit`)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title={t('common.edit')}>
                  <Edit size={18} />
                </button>
                <button onClick={async () => { try { await churchService.deleteChurch(Number(id)); toast.success('Church deleted'); navigate('/church'); } catch { toast.error('Failed to delete church'); } }} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title={t('common.delete')}>
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        </div>
        {church.pastor && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium">
            <User size={16} /> {t('common.pastorLabel', { name: church.pastor.fullName })}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{progress.totalCandidates}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t('common.totalShort')}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{progress.registered}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t('common.registered')}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{progress.inProgress}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t('common.inProgress')}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{progress.readyForBaptism}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t('common.ready')}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{progress.baptized}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t('common.baptized')}</div>
        </div>
      </div>

      {/* Elders & Instructor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Award size={18} className="text-primary" /> {t('common.firstElders')}
          </h2>
          {elders.length === 0 ? (
            <p className="text-gray-400 text-sm">{t('common.noEldersAssigned')}</p>
          ) : (
            <div className="space-y-3">
              {elders.map(e => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/30">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {e.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{e.fullName}</p>
                    <p className="text-xs text-gray-500">{e.email}{e.phone ? ` | ${e.phone}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <GraduationCap size={18} className="text-primary" /> {t('common.instructor')}
          </h2>
          {!instructor ? (
            <p className="text-gray-400 text-sm">{t('common.noInstructorAssigned')}</p>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/30">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {instructor.fullName.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{instructor.fullName}</p>
                <p className="text-xs text-gray-500">{instructor.email}{instructor.phone ? ` | ${instructor.phone}` : ''}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Candidates */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Users size={18} className="text-primary" /> {t('common.candidates')} ({candidates.length})
        </h2>
        {candidates.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">{t('common.noCandidatesRegistered')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">{t('common.name')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">{t('common.email')}</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{c.fullName}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{c.email}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.status === 'BAPTIZED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        c.status === 'READY_FOR_BAPTISM' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        c.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>{c.status.replace(/_/g, ' ')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CMS-Ready Candidates */}
      {candidates.filter(c => c.status === 'BAPTIZED').length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border-l-4 border-green-500">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Award size={18} className="text-green-600" /> {t('common.cmsReadyCandidates')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {t('common.cmsReadyDescription')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {candidates.filter(c => c.status === 'BAPTIZED').map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
                <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-sm">
                  {c.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.email}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium shrink-0">
                  BAPTIZED
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
