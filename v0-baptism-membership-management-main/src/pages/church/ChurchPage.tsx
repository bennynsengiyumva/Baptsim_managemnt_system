import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Trash2,
  Edit,
  Building2,
  UserPlus,
  UserMinus,
} from 'lucide-react';

import { selectUser } from '@/store/authStore';
import { churchService, Church } from '@/services/churchService';
import { userService } from '@/services/userService';

import DataTable, { Column } from '@/components/ui/DataTable';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

/** Pastor type */
interface Pastor {
  id: number;
  fullName: string;
  email?: string;
}

export default function ChurchPage() {
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);
  const { t } = useTranslation();
  const isAdmin = currentUser?.role === 'ADMIN';
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('ALL');

  const [assignModal, setAssignModal] = useState(false);

  const [selectedChurch, setSelectedChurch] = useState<number | null>(null);
  const [selectedPastor, setSelectedPastor] = useState<number | null>(null);

  /** =========================
   * CHURCHES
   * ========================= */
  const { data: churches = [], isLoading, refetch, error } = useQuery<Church[]>({
    queryKey: ['churches'],
    queryFn: churchService.getAllChurches,
  });

  useEffect(() => {
    if (error) toast.error('Failed to load churches');
  }, [error]);

  // Apply district filter from URL search param when data loads
  useEffect(() => {
    const districtId = searchParams.get('districtId');
    if (districtId && churches.length > 0) {
      const matched = churches.find(c => c.districtId === Number(districtId));
      if (matched?.districtName) setFilterDistrict(matched.districtName);
    }
  }, [searchParams, churches]);

  /** =========================
   * PASTORS (FIXED)
   * ========================= */
  const { data: pastors = [] } = useQuery<Pastor[]>({
    queryKey: ['pastors'],
    queryFn: userService.getPastors, // ✅ IMPORTANT FIX HERE
  });

  /** =========================
   * FILTERING
   * ========================= */
  const filteredChurches = churches.filter((c) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      c.churchName?.toLowerCase().includes(search) ||
      c.districtName?.toLowerCase().includes(search) ||
      c.fieldName?.toLowerCase().includes(search) ||
      c.unionName?.toLowerCase().includes(search);

    const matchesFilter =
      filterDistrict === 'ALL' || c.districtName === filterDistrict;

    return matchesSearch && matchesFilter;
  });

  /** =========================
   * DELETE CHURCH
   * ========================= */
  const handleDelete = async (id: number) => {
    try {
      await churchService.deleteChurch(id);
      toast.success('Church deleted');
      refetch();
    } catch {
      toast.error('Failed to delete');
    }
  };

  /** =========================
   * ASSIGN PASTOR
   * ========================= */
  const handleAssignPastor = async () => {
    if (!selectedChurch || !selectedPastor) {
      toast.error('Select a pastor');
      return;
    }

    try {
      await churchService.assignPastor(selectedChurch, selectedPastor);

      toast.success('Pastor assigned');

      setAssignModal(false);
      setSelectedChurch(null);
      setSelectedPastor(null);

      refetch();
    } catch {
      toast.error('Failed to assign pastor');
    }
  };

  /** =========================
   * TABLE COLUMNS
   * ========================= */
  const columns: Column<Church>[] = [
    { key: 'churchName', label: t('common.churchName'), render: (value: string, record: Church) => (
      <button onClick={() => navigate(`/church/${record.id}`)} className="text-primary hover:underline font-medium">{value}</button>
    ) },
    { key: 'districtName', label: t('common.district') },
    { key: 'fieldName', label: t('common.field') },
    { key: 'unionName', label: t('common.union') },

    {
      key: 'pastor',
      label: t('common.pastor'),
      render: (_, record) =>
        record.pastor?.fullName ?? t('common.notAssigned'),
    },

    { key: 'phone', label: t('common.phone') },

    {
      key: 'id',
      label: t('common.actions'),
      render: (value: number, record: Church) => (
        <div className="flex gap-3">
          {isAdmin && (
            <button
              onClick={() => navigate(`/church/${value}/edit`)}
              className="text-green-600"
              title={t('common.edit')}
            >
              <Edit size={18} />
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                setSelectedChurch(value);
                setAssignModal(true);
              }}
              className="text-blue-600"
              title={t('common.assignPastor')}
            >
              <UserPlus size={18} />
            </button>
          )}

          {isAdmin && record.pastor && (
            <button
              onClick={async () => {
                try {
                  await churchService.unassignPastor(value);
                  toast.success('Pastor unassigned');
                  refetch();
                } catch {
                  toast.error('Failed to unassign pastor');
                }
              }}
              className="text-orange-600"
              title={t('common.unassignPastor')}
            >
              <UserMinus size={18} />
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => handleDelete(value)}
              className="text-red-600"
              title={t('common.delete')}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 />
            {t('common.churches')}
          </h1>
          <p className="text-gray-500">{t('common.manageChurches')}</p>
        </div>

        {isAdmin && (
          <Button onClick={() => navigate('/church/create')}>
            <Plus />
            {t('common.newChurch')}
          </Button>
        )}
      </div>

      {/* FILTERS */}
      <Card>
        <div className="flex gap-4">
          <input
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded w-full"
          />

          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="ALL">{t('common.allDistricts')}</option>
          </select>
        </div>
      </Card>

      {/* TABLE */}
      <Card>
        <DataTable<Church>
          columns={columns}
          data={filteredChurches}
          isLoading={isLoading}
          emptyMessage={t('common.noChurchesFound')}
        />
      </Card>

      {/* ASSIGN PASTOR MODAL */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-[450px] space-y-4">

            <h2 className="text-xl font-bold">{t('common.assignPastor')}</h2>

            <select
              className="w-full border p-2 rounded"
              onChange={(e) =>
                setSelectedPastor(Number(e.target.value))
              }
            >
              <option value="">{t('common.selectPastor')}</option>

              {pastors.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button onClick={() => setAssignModal(false)}>
                {t('common.cancel')}
              </button>

              <button
                onClick={handleAssignPastor}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                {t('common.assign')}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}