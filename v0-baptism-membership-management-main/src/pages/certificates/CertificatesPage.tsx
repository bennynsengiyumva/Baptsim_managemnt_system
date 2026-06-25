import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Download, Trash2, Award } from 'lucide-react';
import { fetchCertificates, deleteCertificate, selectCertificates, selectCertificateLoading } from '@/store/slices/certificateSlice';
import DataTable from '@/components/ui/DataTable';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Certificate } from '@/types';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function CertificatesPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const certificates = useSelector(selectCertificates);
  const isLoading = useSelector(selectCertificateLoading);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (id: string) => {
    try {
      await (dispatch(deleteCertificate(id) as any) as any).unwrap();
      toast.success('Certificate deleted');
    } catch {
      toast.error('Failed to delete certificate');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        await (dispatch(fetchCertificates({}) as any) as any).unwrap();
      } catch {
        toast.error('Failed to load certificates');
      }
    };
    load();
  }, [dispatch]);

  const filteredCertificates = certificates.filter(
    (c: Certificate) =>
      c.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'COMPLETION':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'BAPTISM':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'MEMBERSHIP':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const columns = [
    { key: 'recipientName' as keyof Certificate, label: t('common.recipientName') },
    { key: 'certificateNumber', label: t('common.certificateNo') },
    {
      key: 'type' as keyof Certificate,
      label: t('common.typeColumn'),
      render: (value: any) => (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(value)}`}>{value}</span>
      ),
    },
    {
      key: 'issuedDate' as keyof Certificate,
      label: t('common.issuedDate'),
      render: (value: any) => (value ? new Date(value).toLocaleDateString() : '-'),
    },
    {
      key: 'id' as keyof Certificate,
      label: t('common.actions'),
      render: (_value: any, row: Certificate) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/certificates/${row.id}`)}
            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award size={32} /> {t('common.certificates')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{t('common.manageCertificates')}</p>
        </div>
        <Button onClick={() => navigate('/certificates/new')} className="flex items-center gap-2">
          <Plus size={20} />
          {t('common.newCertificate')}
        </Button>
      </div>

      <Card>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder={t('common.searchCertificates')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
          />
        </div>
      </Card>

      <Card>
        <DataTable columns={columns} data={filteredCertificates} isLoading={isLoading} emptyMessage={t('common.noCertificatesFound')} />
      </Card>
    </div>
  );
}
