import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { instructorService } from '@/services/instructorService';
import { selectUser } from '@/store/authStore';
import apiClient from '@/services/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { Instructor } from '@/types';
import { Eye, EyeOff } from 'lucide-react';

interface Church {
  id: number;
  churchName: string;
}

interface InstructorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  instructor?: Instructor | null;
}

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  qualification: '',
  yearsOfService: 0,
  churchId: '',
  password: '',
  confirmPassword: '',
};

export default function InstructorFormModal({ isOpen, onClose, onSaved, instructor }: InstructorFormModalProps) {
  const currentUser = useSelector(selectUser);
  const isFCE = currentUser?.role === 'FIRST_CHURCH_ELDER';
  const isEditMode = !!instructor;
  const [form, setForm] = useState(emptyForm);
  const [churches, setChurches] = useState<Church[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingChurches, setIsLoadingChurches] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoadingChurches(true);
    apiClient
      .get('/api/churches')
      .then((res) => {
        const data = res.data;
        setChurches(Array.isArray(data) ? data : data?.data ?? []);
      })
      .catch(() => {
        toast.error('Failed to load churches');
        setChurches([]);
      })
      .finally(() => setIsLoadingChurches(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (instructor) {
      setForm({
        fullName: instructor.fullName || '',
        email: instructor.email || '',
        phone: instructor.phone || '',
        qualification: instructor.qualification || '',
        yearsOfService: instructor.yearsOfService ?? 0,
        churchId: instructor.churchId ? String(instructor.churchId) : '',
        password: '',
        confirmPassword: '',
      });
    } else {
      setForm({ ...emptyForm, churchId: isFCE && currentUser?.churchId ? String(currentUser.churchId) : '' });
    }
  }, [isOpen, instructor]);

  const handleChange = (field: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullName || !form.email || !form.phone || !form.churchId) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Password validation for create mode only
    if (!isEditMode) {
      if (!form.password) {
        toast.error('Password is required');
        return;
      }
      if (form.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (form.password !== form.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    const payload: any = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      qualification: form.qualification,
      yearsOfService: Number(form.yearsOfService),
      churchId: Number(form.churchId),
    };

    if (!isEditMode) {
      payload.password = form.password;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && instructor) {
        await instructorService.updateInstructor(String(instructor.id), payload);
        toast.success('Instructor updated');
      } else {
        await instructorService.createInstructor(payload);
        toast.success('Instructor created');
      }
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (isEditMode ? 'Failed to update instructor' : 'Failed to create instructor'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Instructor' : 'New Instructor'}>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
          <input type="text" value={form.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className={inputClass} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
          <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className={inputClass} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone *</label>
          <input type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className={inputClass} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Church *</label>
          {isFCE ? (
            <input
              type="text"
              value={currentUser?.churchName || 'Your church'}
              disabled
              className={inputClass + ' opacity-70'}
            />
          ) : (
            <select
              value={form.churchId}
              onChange={(e) => handleChange('churchId', e.target.value)}
              className={inputClass}
              required
              disabled={isLoadingChurches}
            >
              <option value="">{isLoadingChurches ? 'Loading churches...' : 'Select a church'}</option>
              {churches.map((c) => (
                <option key={c.id} value={c.id}>{c.churchName}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Qualification</label>
          <input type="text" value={form.qualification} onChange={(e) => handleChange('qualification', e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Years of Service</label>
          <input type="number" min={0} value={form.yearsOfService} onChange={(e) => handleChange('yearsOfService', e.target.value)} className={inputClass} />
        </div>

        {/* Password fields — create mode only */}
        {!isEditMode && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={inputClass}
                  placeholder="Min. 6 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={inputClass}
                  placeholder="Re-enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" onClick={onClose} className="bg-slate-200 text-slate-900 hover:bg-slate-300">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Instructor' : 'Create Instructor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}