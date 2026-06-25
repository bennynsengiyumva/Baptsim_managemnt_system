import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Users } from 'lucide-react';
import { selectUser } from '@/store/authStore';
import { firstChurchElderService } from '@/services/firstChurchElderService';
import { churchService } from '@/services/churchService';
import { FirstChurchElder } from '@/types';
import { Church } from '@/services/churchService';
import Card from '@/components/ui/Card';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function FirstChurchEldersPage() {
  const { t } = useTranslation();
  const currentUser = useSelector(selectUser);
  const canDelete = ['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'PASTOR'].includes(currentUser?.role || '');

  const [elders, setElders] = useState<FirstChurchElder[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      firstChurchElderService.getAll(),
      churchService.getAllChurches(),
    ]).then(([e, c]) => {
      setElders(e);
      setChurches(c);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('common.deleteThisElder'))) return;
    try {
      await firstChurchElderService.delete(id);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Users /> {t('common.firstChurchElders')}</h1>
          <p className="text-gray-500">{t('common.firstChurchEldersView')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {churches.map((church) => {
          const churchElders = elders.filter((e) => e.churchId === church.id);
          return (
            <Card key={church.id}>
              <h3 className="font-bold text-lg mb-2">{church.churchName}</h3>
              {churchElders.length === 0 ? (
                <p className="text-sm text-gray-500">{t('common.noElderAssigned')}</p>
              ) : (
                <ul className="space-y-1">
                  {churchElders.map((elder) => (
                    <li key={elder.id} className="text-sm flex justify-between">
                      <span>{elder.fullName}</span>
                      {canDelete && (
                        <button onClick={() => handleDelete(elder.id)} className="text-red-500 text-xs">{t('common.remove')}</button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      {loading && <p className="text-center text-gray-500">{t('common.loading')}</p>}
    </div>
  );
}
