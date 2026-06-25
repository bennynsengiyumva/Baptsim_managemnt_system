import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Users as UsersIcon, Building2, UserPlus, ChevronDown, ChevronRight, MapPin, X } from 'lucide-react';
import {
  fetchUsers,
  deleteUser,
  createUser,
  selectUsers,
  selectUsersLoading,
  selectUser,
} from '@/store/authStore';
import DataTable from '@/components/ui/DataTable';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { User, Union, ChurchField } from '@/types';
import { unionService } from '@/services/unionService';
import { fieldService } from '@/services/fieldService';
import { userService } from '@/services/userService';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const CREATABLE_ROLE: Record<string, string> = {
  ADMIN: 'HEAD_OF_RUM',
  HEAD_OF_RUM: 'HEAD_OF_FIELD',
  HEAD_OF_FIELD: 'HEAD_OF_DISTRICT',
  HEAD_OF_DISTRICT: 'FIRST_CHURCH_ELDER',
  PASTOR: 'FIRST_CHURCH_ELDER',
  FIRST_CHURCH_ELDER: 'INSTRUCTOR',
};

interface NewUserForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  selectedRole?: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  submit?: string;
}

export default function UsersPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const users = useSelector(selectUsers);
  const isLoading = useSelector(selectUsersLoading);
  const currentUser = useSelector(selectUser);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<NewUserForm>({ fullName: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});

  const [rumModalOpen, setRumModalOpen] = useState(false);
  const [rumForm, setRumForm] = useState({ name: '', code: '', address: '', phone: '', email: '' });
  const [createHead, setCreateHead] = useState(false);
  const [rumHeadForm, setRumHeadForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [rumSubmitting, setRumSubmitting] = useState(false);

  const [showStructure, setShowStructure] = useState(false);
  const [unions, setUnions] = useState<Union[]>([]);
  const [unionsLoading, setUnionsLoading] = useState(false);
  const [expandedUnion, setExpandedUnion] = useState<number | null>(null);
  const [fields, setFields] = useState<ChurchField[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [expandedField, setExpandedField] = useState<number | null>(null);
  const [fieldLeaders, setFieldLeaders] = useState<User[]>([]);
  const [leadersLoading, setLeadersLoading] = useState(false);

  const creatableRole = currentUser?.role ? CREATABLE_ROLE[currentUser.role] : null;

  useEffect(() => {
    dispatch(fetchUsers() as any).catch(() => toast.error('Failed to load users'));
  }, [dispatch]);

  const visibleRoles: Record<string, string[]> = {
    ADMIN: ['ADMIN', 'HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT', 'PASTOR', 'FIRST_CHURCH_ELDER', 'INSTRUCTOR', 'CANDIDATE'],
    HEAD_OF_RUM: ['HEAD_OF_RUM', 'HEAD_OF_FIELD', 'HEAD_OF_DISTRICT', 'PASTOR', 'FIRST_CHURCH_ELDER', 'INSTRUCTOR', 'CANDIDATE'],
    HEAD_OF_FIELD: ['HEAD_OF_FIELD', 'HEAD_OF_DISTRICT', 'PASTOR', 'FIRST_CHURCH_ELDER', 'INSTRUCTOR', 'CANDIDATE'],
    HEAD_OF_DISTRICT: ['HEAD_OF_DISTRICT', 'PASTOR', 'FIRST_CHURCH_ELDER', 'INSTRUCTOR', 'CANDIDATE'],
    PASTOR: ['PASTOR', 'FIRST_CHURCH_ELDER', 'INSTRUCTOR', 'CANDIDATE'],
    FIRST_CHURCH_ELDER: ['FIRST_CHURCH_ELDER', 'INSTRUCTOR', 'CANDIDATE'],
  };

  const allowedRoles = visibleRoles[currentUser?.role || ''] || ['CANDIDATE'];

  const filteredUsers = users.filter((u: User) => {
    const matchesRoleScope = allowedRoles.includes(u.role);
    const matchesSearch =
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    return matchesRoleScope && matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':             return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'HEAD_OF_RUM':       return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'HEAD_OF_FIELD':     return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'HEAD_OF_DISTRICT':  return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      case 'PASTOR':            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'FIRST_CHURCH_ELDER':return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300';
      case 'INSTRUCTOR':        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'CANDIDATE':         return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:                  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const openModal = () => {
    setForm({ fullName: '', email: '', phone: '', password: '', selectedRole: currentUser?.role === 'ADMIN' ? 'HEAD_OF_RUM' : undefined });
    setErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.fullName.trim()) errs.fullName = t('common.fullNameRequiredError');
    if (!form.email.trim() || !form.email.includes('@')) errs.email = t('common.validEmailRequired');
    if (!form.password.trim()) errs.password = t('common.passwordRequiredError');
    if (currentUser?.role === 'ADMIN' && !form.selectedRole) errs.submit = t('common.roleRequired');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    const targetRole = currentUser?.role === 'ADMIN' ? form.selectedRole : creatableRole;
    if (!validate() || !targetRole) return;
    setSubmitting(true);
    setErrors({});

    const result = await dispatch(
      createUser({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: targetRole,
      }) as any
    );

    setSubmitting(false);

    if (createUser.fulfilled.match(result)) {
      setModalOpen(false);
      toast.success(`${targetRole.charAt(0) + targetRole.slice(1).toLowerCase()} created successfully`);
      // Refetch to get the real server-assigned id replacing the temp one
      dispatch(fetchUsers() as any);
    } else {
      const msg = result.payload || 'Failed to create user';
      setErrors({ submit: msg });
      toast.error(msg);
    }
  };

  const handleDelete = async (userId: string) => {
    const result = await dispatch(deleteUser(userId) as any);
    if (deleteUser.fulfilled.match(result)) {
      toast.success('User deleted');
    } else {
      toast.error('Failed to delete user');
    }
  };

  const columns = [
    { key: 'fullName', label: t('common.name') },
    { key: 'email', label: t('common.email') },
    {
      key: 'role',
      label: t('common.role'),
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'id',
      label: t('common.actions'),
      render: (value: string) => (
        <div className="flex items-center gap-2">
          {currentUser?.role === 'ADMIN' && (
            <>
              <button
                onClick={() => navigate(`/users/${value}/edit`)}
                className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition"
                title={t('common.edit')}
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => handleDelete(value)}
                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition"
                title={t('common.delete')}
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UsersIcon size={32} /> {t('common.userManagement')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{t('common.userManagementDesc')}</p>
        </div>
        <div className="flex items-center gap-3">
          {currentUser?.role === 'ADMIN' && (
            <Button onClick={() => { setRumForm({ name: 'Rwanda Union Mission', code: 'RUM', address: '', phone: '', email: '' }); setCreateHead(false); setRumHeadForm({ fullName: '', email: '', phone: '', password: '' }); setRumModalOpen(true); }} variant="secondary" className="flex items-center gap-2">
              <Building2 size={18} /> {t('common.createRum')}
            </Button>
          )}
          {(currentUser?.role === 'ADMIN' || creatableRole) && (
            <Button onClick={openModal} className="flex items-center gap-2">
              <Plus size={20} />
              {currentUser?.role === 'ADMIN' ? t('common.newUser') : `New ${creatableRole!.charAt(0) + creatableRole!.slice(1).toLowerCase()}`}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder={t('common.searchByNameOrEmail')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">{t('common.allRoles')}</option>
            <option value="ADMIN">{t('common.admin')}</option>
            <option value="HEAD_OF_RUM">{t('common.headOfRum')}</option>
            <option value="HEAD_OF_FIELD">{t('common.headOfField')}</option>
            <option value="HEAD_OF_DISTRICT">{t('common.headOfDistrict')}</option>
            <option value="PASTOR">{t('common.pastor')}</option>
            <option value="FIRST_CHURCH_ELDER">{t('common.firstChurchElder')}</option>
            <option value="INSTRUCTOR">{t('common.instructor')}</option>
            <option value="CANDIDATE">{t('common.candidate')}</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          data={filteredUsers}
          isLoading={isLoading}
          emptyMessage={t('common.noUsersFound')}
        />
      </Card>

      {/* RUM Structure Section */}
      {currentUser?.role === 'ADMIN' && (
        <Card>
          <button
            onClick={() => {
              setShowStructure(!showStructure);
              if (!showStructure && unions.length === 0) {
                setUnionsLoading(true);
                unionService.getAll().then(setUnions).finally(() => setUnionsLoading(false));
              }
            }}
            className="w-full flex items-center justify-between p-1"
          >
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
              <Building2 size={22} />
              {t('common.rumStructure')}
              {unionsLoading && <span className="text-sm text-slate-400 font-normal ml-2">{t('common.loading')}</span>}
            </div>
            {showStructure ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>

          {showStructure && (
            <div className="mt-4 space-y-3">
              {unions.length === 0 && !unionsLoading && (
                <p className="text-slate-500 text-sm">{t('common.noUnionsCreateRum')}</p>
              )}

              {unions.map((union) => (
                <div key={union.id} className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => {
                      if (expandedUnion === union.id) {
                        setExpandedUnion(null);
                        setExpandedField(null);
                      } else {
                        setExpandedUnion(union.id);
                        setExpandedField(null);
                        setFieldsLoading(true);
                        fieldService.getByUnion(union.id).then(setFields).finally(() => setFieldsLoading(false));
                      }
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                      <Building2 size={18} className="text-purple-600" />
                      {union.name}
                      {union.code && <span className="text-xs text-slate-400 font-normal">({union.code})</span>}
                    </div>
                    {expandedUnion === union.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>

                  {expandedUnion === union.id && (
                    <div className="px-4 py-3 space-y-2">
                      {(union.address || union.phone || union.email) && (
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-2">
                          {union.address && <span>📍 {union.address}</span>}
                          {union.phone && <span>📞 {union.phone}</span>}
                          {union.email && <span>✉️ {union.email}</span>}
                        </div>
                      )}

                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('common.fields')}</p>

                      {fieldsLoading ? (
                        <p className="text-xs text-slate-400">{t('common.loading')}</p>
                      ) : fields.length === 0 ? (
                        <p className="text-xs text-slate-500">{t('common.noFieldsInUnion')}</p>
                      ) : (
                        <div className="space-y-2">
                          {fields.map((field) => (
                            <div key={field.id} className="border border-slate-100 dark:border-slate-700 rounded-md overflow-hidden ml-2">
                              <button
                                onClick={() => {
                                  if (expandedField === field.id) {
                                    setExpandedField(null);
                                  } else {
                                    setExpandedField(field.id);
                                    setLeadersLoading(true);
                                    userService.getByField(field.id).then(setFieldLeaders).finally(() => setLeadersLoading(false));
                                  }
                                }}
                                className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                              >
                                <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                                  <MapPin size={15} className="text-indigo-500" />
                                  {field.name}
                                </div>
                                {expandedField === field.id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                              </button>

                              {expandedField === field.id && (
                                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('common.leaders')}</p>
                                  {leadersLoading ? (
                                    <p className="text-xs text-slate-400">{t('common.loading')}</p>
                                  ) : fieldLeaders.length === 0 ? (
                                    <p className="text-xs text-slate-500">{t('common.noLeadersInField')}</p>
                                  ) : (
                                    <div className="space-y-1">
                                      {fieldLeaders.map((leader) => (
                                        <div key={leader.id} className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 py-1 px-2 bg-white dark:bg-slate-700 rounded">
                                          <span className="font-medium">{leader.fullName}</span>
                                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(leader.role)}`}>
                                            {leader.role}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Create User Modal */}
      {modalOpen && (currentUser?.role === 'ADMIN' || creatableRole) && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {currentUser?.role === 'ADMIN' ? t('common.createUserAccount') : `New ${creatableRole!.charAt(0) + creatableRole!.slice(1).toLowerCase()}`}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentUser?.role === 'ADMIN' ? t('common.createUserAccountDesc') : t('common.createAsRoleDesc', { role: currentUser?.role, creatableRole })}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('common.fullName')}</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder={t('common.fullNamePlaceholder')}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('common.email')}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={t('common.emailPlaceholder')}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('common.phoneOptional')}
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder={t('common.phonePlaceholder')}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('common.role')}</label>
                {currentUser?.role === 'ADMIN' ? (
                  <select
                    value={form.selectedRole || ''}
                    onChange={(e) => setForm({ ...form, selectedRole: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                  >
                    <option value="" disabled>{t('common.selectRole')}</option>
                    <option value="HEAD_OF_RUM">HEAD_OF_RUM - {t('common.headOfRum')}</option>
                    <option value="HEAD_OF_FIELD">HEAD_OF_FIELD - {t('common.headOfField')}</option>
                    <option value="HEAD_OF_DISTRICT">HEAD_OF_DISTRICT - {t('common.headOfDistrict')}</option>
                    <option value="PASTOR">PASTOR - {t('common.pastor')}</option>
                    <option value="FIRST_CHURCH_ELDER">FIRST_CHURCH_ELDER - {t('common.firstChurchElder')}</option>
                    <option value="INSTRUCTOR">INSTRUCTOR - {t('common.instructor')}</option>
                    <option value="CANDIDATE">CANDIDATE - {t('common.candidate')}</option>
                  </select>
                ) : (
                  <div className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(creatableRole!)}`}>
                      {creatableRole}
                    </span>
                    <span className="text-xs text-slate-400">{t('common.autoAssignedByRole')}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('common.password')}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={t('common.tempPasswordPlaceholder')}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              {errors.submit && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  <p className="text-red-600 dark:text-red-400 text-sm">{errors.submit}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                {t('common.cancel')}
              </button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2">
                <Plus size={16} />
                {submitting ? t('common.creating') : `${t('common.create')} ${currentUser?.role === 'ADMIN' ? t('common.user') : (creatableRole ? creatableRole.charAt(0) + creatableRole.slice(1).toLowerCase() : t('common.user'))}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create RUM Modal */}
      {rumModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => { if (e.target === e.currentTarget) setRumModalOpen(false); }}>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 w-[540px] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 size={22} /> {t('common.createRumMission')}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('common.createRumDesc')}
                </p>
              </div>
              <button onClick={() => setRumModalOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('common.nameRequired')}</label>
                <input value={rumForm.name} onChange={(e) => setRumForm({ ...rumForm, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('common.code')}</label>
                <input value={rumForm.code} onChange={(e) => setRumForm({ ...rumForm, code: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary" placeholder={t('common.codePlaceholder')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('common.address')}</label>
                <input value={rumForm.address} onChange={(e) => setRumForm({ ...rumForm, address: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('common.phone')}</label>
                  <input value={rumForm.phone} onChange={(e) => setRumForm({ ...rumForm, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('common.email')}</label>
                  <input value={rumForm.email} onChange={(e) => setRumForm({ ...rumForm, email: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-600 pt-3 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={createHead} onChange={(e) => setCreateHead(e.target.checked)} className="rounded text-primary focus:ring-primary" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1"><UserPlus size={16} /> {t('common.createHeadOfRumAccount')}</span>
              </label>
              {createHead && (
                <div className="mt-3 pl-4 border-l-2 border-primary space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('common.fullNameRequired')}</label>
                    <input value={rumHeadForm.fullName} onChange={(e) => setRumHeadForm({ ...rumHeadForm, fullName: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary" placeholder={t('common.headOfRumNamePlaceholder')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('common.emailRequired')}</label>
                    <input type="email" value={rumHeadForm.email} onChange={(e) => setRumHeadForm({ ...rumHeadForm, email: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary" placeholder={t('common.headEmailPlaceholder')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('common.phone')}</label>
                    <input value={rumHeadForm.phone} onChange={(e) => setRumHeadForm({ ...rumHeadForm, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('common.passwordRequired')}</label>
                    <input type="password" value={rumHeadForm.password} onChange={(e) => setRumHeadForm({ ...rumHeadForm, password: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setRumModalOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                {t('common.cancel')}
              </button>
              <Button onClick={async () => {
                if (!rumForm.name.trim()) return;
                setRumSubmitting(true);
                try {
                  await unionService.create({
                    ...rumForm,
                    createHeadAccount: createHead,
                    headFullName: rumHeadForm.fullName,
                    headEmail: rumHeadForm.email,
                    headPhone: rumHeadForm.phone,
                    headPassword: rumHeadForm.password,
                  });
                  setRumModalOpen(false);
                  toast.success(createHead ? 'RUM created with Head of RUM account' : 'RUM created successfully');
                } catch {
                  toast.error('Failed to create RUM');
                } finally {
                  setRumSubmitting(false);
                }
              }} disabled={rumSubmitting} isLoading={rumSubmitting} className="flex items-center gap-2">
                <Building2 size={16} />
                {t('common.createRum')}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}