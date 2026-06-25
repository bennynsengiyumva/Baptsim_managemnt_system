import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { unionService } from '@/services/unionService';
import { fieldService } from '@/services/fieldService';
import { districtService } from '@/services/districtService';
import { churchService } from '@/services/churchService';
import { ChurchDetail } from '@/types';
import Card from '@/components/ui/Card';
import { useTranslation } from 'react-i18next';
import {
  Building2, ChevronRight, ChevronLeft, MapPin, Users, UserCheck,
  GraduationCap, Church as ChurchIcon
} from 'lucide-react';

type Level = 'union' | 'field' | 'district' | 'church' | 'detail';

export default function HierarchyHomePage() {
  const { t } = useTranslation();
  const user = useSelector(selectUser);

  const [selectedUnionId, setSelectedUnionId] = useState<number | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedChurch, setSelectedChurch] = useState<ChurchDetail | null>(null);

  const { data: unions = [] } = useQuery({
    queryKey: ['unions'],
    queryFn: () => unionService.getAll(),
  });

  const { data: fields = [] } = useQuery({
    queryKey: ['fields-by-union', selectedUnionId],
    queryFn: () => fieldService.getByUnion(selectedUnionId!),
    enabled: !!selectedUnionId,
  });

  const { data: districts = [] } = useQuery({
    queryKey: ['districts-by-field', selectedFieldId],
    queryFn: () => districtService.getByField(selectedFieldId!),
    enabled: !!selectedFieldId,
  });

  const { data: churches = [] } = useQuery({
    queryKey: ['churches-by-district', selectedDistrictId],
    queryFn: () => churchService.getChurchesByDistrict(selectedDistrictId!),
    enabled: !!selectedDistrictId,
  });

  const level: Level = selectedChurch ? 'detail'
    : selectedDistrictId ? 'church'
    : selectedFieldId ? 'district'
    : selectedUnionId ? 'field'
    : 'union';

  const handleBack = () => {
    if (selectedChurch) { setSelectedChurch(null); return; }
    if (selectedDistrictId) { setSelectedDistrictId(null); return; }
    if (selectedFieldId) { setSelectedFieldId(null); return; }
    if (selectedUnionId) { setSelectedUnionId(null); return; }
  };

  const getBreadcrumbs = () => {
    const crumbs: { label: string; onClick: () => void }[] = [];
    if (selectedUnionId) {
      const u = unions.find(u => u.id === selectedUnionId);
      crumbs.push({ label: u?.name || 'Union', onClick: () => { setSelectedFieldId(null); setSelectedDistrictId(null); setSelectedChurch(null); } });
    }
    if (selectedFieldId) {
      const f = fields.find(f => f.id === selectedFieldId);
      crumbs.push({ label: f?.name || 'Field', onClick: () => { setSelectedDistrictId(null); setSelectedChurch(null); } });
    }
    if (selectedDistrictId) {
      const d = districts.find(d => d.id === selectedDistrictId);
      crumbs.push({ label: d?.name || 'District', onClick: () => { setSelectedChurch(null); } });
    }
    if (selectedChurch) {
      crumbs.push({ label: selectedChurch.church.churchName, onClick: () => {} });
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const selectedUnion = unions.find(u => u.id === selectedUnionId);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Building2 size={32} className="text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold">{t('common.churchHierarchy')}</h1>
          <p className="text-slate-500">
            {user?.role === 'HEAD_OF_RUM' || user?.role === 'HEAD_OF_DISTRICT' ? t('common.hierarchyManageDesc') : t('common.hierarchyBrowseDesc')}
          </p>
        </div>
      </div>

      {/* BREADCRUMBS */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-slate-600">
          <button onClick={() => { setSelectedUnionId(null); setSelectedFieldId(null); setSelectedDistrictId(null); setSelectedChurch(null); }}
            className="hover:text-indigo-600 transition-colors">
            {t('common.allUnions')}
          </button>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              <ChevronRight size={14} />
              <button onClick={crumb.onClick} className="hover:text-indigo-600 transition-colors">
                {crumb.label}
              </button>
            </span>
          ))}
        </nav>
      )}

      {/* BACK BUTTON */}
      {level !== 'union' && (
        <button onClick={handleBack} className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
          <ChevronLeft size={16} /> {t('common.back')}
        </button>
      )}

      {/* LEVEL: UNION */}
      {level === 'union' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unions.map(union => (
            <Card key={union.id}>
              <button onClick={() => setSelectedUnionId(union.id)} className="w-full text-left">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 size={24} className="text-indigo-500" />
                  <div>
                    <h3 className="font-semibold text-lg">{union.name}</h3>
                    {union.code && <p className="text-xs text-slate-500">{union.code}</p>}
                  </div>
                </div>
                {union.address && <p className="text-sm text-slate-600">{union.address}</p>}
                <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600 font-medium">
                  {t('common.viewFields')} <ChevronRight size={14} />
                </div>
              </button>
            </Card>
          ))}
          {unions.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">{t('common.noUnionsFound')}</div>
          )}
        </div>
      )}

      {/* LEVEL: FIELD */}
      {level === 'field' && selectedUnion && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold">{selectedUnion.name}</h2>
            <p className="text-sm text-slate-500">{t('common.fieldCount', { count: fields.length })}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fields.map(field => (
              <Card key={field.id}>
                <button onClick={() => setSelectedFieldId(field.id)} className="w-full text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin size={24} className="text-emerald-500" />
                    <div>
                      <h3 className="font-semibold text-lg">{field.name}</h3>
                      {field.code && <p className="text-xs text-slate-500">{field.code}</p>}
                    </div>
                  </div>
                  {field.address && <p className="text-sm text-slate-600">{field.address}</p>}
                  <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600 font-medium">
                    {t('common.viewDistricts')} <ChevronRight size={14} />
                  </div>
                </button>
              </Card>
            ))}
            {fields.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500">{t('common.noFieldsFoundInUnion')}</div>
            )}
          </div>
        </div>
      )}

      {/* LEVEL: DISTRICT */}
      {level === 'district' && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold">{fields.find(f => f.id === selectedFieldId)?.name}</h2>
            <p className="text-sm text-slate-500">{t('common.districtCount', { count: districts.length })}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {districts.map(district => (
              <Card key={district.id}>
                <button onClick={() => setSelectedDistrictId(district.id)} className="w-full text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin size={24} className="text-amber-500" />
                    <div>
                      <h3 className="font-semibold text-lg">{district.name}</h3>
                      {district.code && <p className="text-xs text-slate-500">{district.code}</p>}
                    </div>
                  </div>
                  {district.address && <p className="text-sm text-slate-600">{district.address}</p>}
                  <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600 font-medium">
                    {t('common.viewChurches')} <ChevronRight size={14} />
                  </div>
                </button>
              </Card>
            ))}
            {districts.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500">{t('common.noDistrictsFoundInField')}</div>
            )}
          </div>
        </div>
      )}

      {/* LEVEL: CHURCH LIST */}
      {level === 'church' && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold">{districts.find(d => d.id === selectedDistrictId)?.name}</h2>
            <p className="text-sm text-slate-500">{t('common.churchCount', { count: churches.length })}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {churches.map(church => (
              <Card key={church.id}>
                <button onClick={async () => {
                  try {
                    const detail = await churchService.getChurchDetail(church.id);
                    setSelectedChurch(detail);
                  } catch (e) {
                    setSelectedChurch({
                      church,
                      elders: [],
                      instructor: null,
                      candidates: [],
                      progress: { totalCandidates: 0, registered: 0, inProgress: 0, readyForBaptism: 0, baptized: 0, futureDated: 0 }
                    });
                  }
                }} className="w-full text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <ChurchIcon size={24} className="text-purple-500" />
                    <div>
                      <h3 className="font-semibold text-lg">{church.churchName}</h3>
                      {church.pastor && <p className="text-xs text-slate-500">{t('common.pastor')}: {church.pastor.fullName}</p>}
                    </div>
                  </div>
                  {church.address && <p className="text-sm text-slate-600">{church.address}</p>}
                  {church.phone && <p className="text-sm text-slate-500">{church.phone}</p>}
                  <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600 font-medium">
                    {t('common.viewDetails')} <ChevronRight size={14} />
                  </div>
                </button>
              </Card>
            ))}
            {churches.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500">{t('common.noChurchesFoundInDistrict')}</div>
            )}
          </div>
        </div>
      )}

      {/* LEVEL: CHURCH DETAIL */}
      {level === 'detail' && selectedChurch && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{selectedChurch.church.churchName}</h2>
            <p className="text-slate-500">
              {selectedChurch.church.address && <span>{selectedChurch.church.address} &middot; </span>}
              {selectedChurch.church.phone && <span>{selectedChurch.church.phone}</span>}
              {selectedChurch.church.pastor && <span> &middot; {t('common.pastor')}: {selectedChurch.church.pastor.fullName}</span>}
            </p>
          </div>

          {/* Progress Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <h4 className="text-xs font-medium text-slate-500 mb-1">{t('common.totalCandidates')}</h4>
              <p className="text-2xl font-bold">{selectedChurch.progress.totalCandidates}</p>
            </Card>
            <Card>
              <h4 className="text-xs font-medium text-slate-500 mb-1">{t('common.registered')}</h4>
              <p className="text-2xl font-bold text-blue-600">{selectedChurch.progress.registered}</p>
            </Card>
            <Card>
              <h4 className="text-xs font-medium text-slate-500 mb-1">{t('common.inProgress')}</h4>
              <p className="text-2xl font-bold text-amber-600">{selectedChurch.progress.inProgress}</p>
            </Card>
            <Card>
              <h4 className="text-xs font-medium text-slate-500 mb-1">{t('common.readyForBaptism')}</h4>
              <p className="text-2xl font-bold text-purple-600">{selectedChurch.progress.readyForBaptism}</p>
            </Card>
            <Card>
              <h4 className="text-xs font-medium text-slate-500 mb-1">{t('common.baptized')}</h4>
              <p className="text-2xl font-bold text-green-600">{selectedChurch.progress.baptized}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* First Church Elders */}
            <Card title={`${t('common.elders')} (${selectedChurch.elders.length})`}>
              {selectedChurch.elders.length > 0 ? (
                <div className="space-y-3">
                  {selectedChurch.elders.map(elder => (
                    <div key={elder.id} className="flex items-center gap-3 p-3 border rounded">
                      <Users size={18} className="text-slate-400" />
                      <div>
                        <p className="font-medium text-sm">{elder.fullName}</p>
                        <p className="text-xs text-slate-500">{elder.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">{t('common.noEldersAssigned')}</p>
              )}
            </Card>

            {/* Instructor */}
            <Card title={t('common.instructor')}>
              {selectedChurch.instructor ? (
                <div className="flex items-center gap-3 p-3 border rounded">
                  <GraduationCap size={18} className="text-indigo-400" />
                  <div>
                    <p className="font-medium text-sm">{selectedChurch.instructor.fullName}</p>
                    <p className="text-xs text-slate-500">{selectedChurch.instructor.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">{t('common.noInstructorAssigned')}</p>
              )}
            </Card>
          </div>

          {/* Candidates List */}
          <Card title={`${t('common.candidates')} (${selectedChurch.candidates.length})`}>
            {selectedChurch.candidates.length > 0 ? (
              <div className="space-y-2">
                {selectedChurch.candidates.map(candidate => (
                  <div key={candidate.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <UserCheck size={18} className="text-slate-400" />
                      <div>
                        <p className="font-medium text-sm">{candidate.fullName}</p>
                        <p className="text-xs text-slate-500">{candidate.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      candidate.status === 'BAPTIZED' ? 'bg-green-100 text-green-800' :
                      candidate.status === 'READY_FOR_BAPTISM' ? 'bg-purple-100 text-purple-800' :
                      candidate.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {candidate.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">{t('common.noCandidatesYet')}</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
