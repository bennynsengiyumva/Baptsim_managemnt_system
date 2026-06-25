import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BookOpen, Plus, Search, Edit, Trash2, Users } from 'lucide-react';
import {
  fetchInstructors,
  deleteInstructor,
  selectInstructors,
  selectInstructorLoading,
} from '@/store/slices/instructorSlice';
import DataTable from '@/components/ui/DataTable';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import InstructorFormModal from '@/components/instructors/InstructorFormModal';
import { Instructor } from '@/types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function InstructorsPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const instructors = useSelector(selectInstructors);
  const isLoading   = useSelector(selectInstructorLoading);

  const [searchTerm,        setSearchTerm]        = useState('');
  const [filterStatus,      setFilterStatus]      = useState('ALL');
  const [isModalOpen,       setIsModalOpen]       = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);

  useEffect(() => {
    dispatch(fetchInstructors({} as any) as any);
  }, [dispatch]);

  const filteredInstructors = instructors.filter((i: Instructor) => {
    const matchesSearch =
      i.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'ALL' ||
      (i.active ? 'ACTIVE' : 'INACTIVE') === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this instructor?')) {
      try {
        await dispatch(deleteInstructor(id) as any).unwrap();
        toast.success('Instructor deleted');
      } catch (err: any) {
        toast.error(err || 'Failed to delete');
      }
    }
  };

  const openCreateModal = () => { setEditingInstructor(null); setIsModalOpen(true); };
  const openEditModal   = (i: Instructor) => { setEditingInstructor(i); setIsModalOpen(true); };

  const columns = [
    { key: 'fullName' as keyof Instructor, label: 'Name' },
    { key: 'email'   as keyof Instructor, label: 'Email' },
    { key: 'phone'   as keyof Instructor, label: 'Phone' },
    {
      key: 'churchName' as keyof Instructor,
      label: 'Church',
      render: (v: any) => v ?? '—',
    },
    {
      key: 'yearsOfService' as keyof Instructor,
      label: 'Experience',
      render: (v: any) => v != null ? `${v} yrs` : '—',
    },
    {
      key: 'candidateCount' as keyof Instructor,
      label: 'Candidates',
      render: (v: any) => {
        const count = v ?? 0;
        const max = 20;
        const isFull = count >= max;
        return (
          <span className={`flex items-center gap-1 font-medium ${isFull ? 'text-orange-600' : 'text-indigo-600'}`}>
            <Users size={14} />
            {count}/{max}
            {isFull && <span className="text-xs ml-1">(full)</span>}
          </span>
        );
      },
    },
    {
      key: 'active' as keyof Instructor,
      label: 'Status',
      render: (v: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${v ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {v ? 'ACTIVE' : 'INACTIVE'}
        </span>
      ),
    },
    {
      key: 'id' as keyof Instructor,
      label: 'Actions',
      render: (_: any, row: Instructor) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleDelete(String(row.id))}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BookOpen size={32} className="text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {t('common.instructors')}
            </h1>
            <p className="text-slate-500">Manage instructors</p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus size={20} /> Add Instructor
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-300 px-3 py-2 rounded-lg"
          >
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          data={filteredInstructors}
          isLoading={isLoading}
          emptyMessage="No instructors found"
        />
      </Card>

      <InstructorFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => dispatch(fetchInstructors({} as any) as any)}
        instructor={editingInstructor}
      />
    </div>
  );
}