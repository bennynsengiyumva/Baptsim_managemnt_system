import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authStore';
import Card from '@/components/ui/Card';
import { churchService } from '@/services/churchService';
import { Church as ChurchIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AnalyticsDashboardPage() {
  const { t } = useTranslation();
  const user = useSelector(selectUser);

  const { data: churches = [] } = useQuery({
    queryKey: ['churches'],
    queryFn: churchService.getAllChurches,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('common.activityOverview')}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          {user?.role === 'HEAD_OF_RUM' ? t('common.allChurchesOverview') : t('common.churchesInYourField')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-100 dark:bg-blue-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('common.totalChurches')}</p>
              <p className="text-3xl font-bold mt-2 text-blue-600 dark:text-blue-300">{churches.length}</p>
            </div>
            <ChurchIcon className="text-blue-600 dark:text-blue-300 opacity-50" size={32} />
          </div>
        </Card>
      </div>

      <Card title={t('common.churchesOverview')}>
        <div className="space-y-2">
          {churches.length === 0 && <p className="text-gray-500">{t('common.noData')}</p>}
          {churches.map((church: any) => (
            <div key={church.id} className="flex justify-between p-3 border-b">
              <div>
                <p className="font-medium">{church.churchName}</p>
                <p className="text-sm text-gray-500">
                  {church.unionName} / {church.fieldName} / {church.districtName}
                </p>
              </div>
              <span className="text-xs text-gray-400">{church.pastor?.fullName || t('common.noPastor')}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
