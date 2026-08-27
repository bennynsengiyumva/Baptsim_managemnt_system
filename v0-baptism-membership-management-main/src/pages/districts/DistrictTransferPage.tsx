import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, User, ArrowRight, Search,
  CheckCircle, AlertCircle, ChevronRight, X, UserPlus
} from 'lucide-react';
import { districtAssignmentService, DistrictAssignment } from '@/services/districtAssignmentService';
import { districtService } from '@/services/districtService';
import { userService } from '@/services/userService';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface DistrictWithAssignment {
  id: number;
  name: string;
  code?: string;
  fieldId: number;
  fieldName?: string;
  currentHead?: {
    id: number;
    fullName: string;
    email: string;
    startDate: string;
  } | null;
  status: string;
}

export default function DistrictTransferPage() {
  const queryClient = useQueryClient();
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictWithAssignment | null>(null);
  const [newHeadId, setNewHeadId] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ fullName: '', email: '', phone: '', password: '' });

  const { data: districts = [], isLoading: districtsLoading } = useQuery({
    queryKey: ['districts'],
    queryFn: districtService.getAll,
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['district-assignments'],
    queryFn: districtAssignmentService.getAll,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAllUsers({ pageSize: 1000 }),
  });

  const headOfDistrictUsers = Array.isArray(usersData?.data?.data)
    ? usersData.data.data.filter((u: any) => u.role === 'HEAD_OF_DISTRICT')
    : [];

  const createUserMutation = useMutation({
    mutationFn: (data: any) => userService.createUser(data),
    onSuccess: (response: any) => {
      const newUser = response?.data;
      if (newUser?.id) {
        setNewHeadId(String(newUser.id));
        setShowCreateAccount(false);
        setNewAccount({ fullName: '', email: '', phone: '', password: '' });
        queryClient.invalidateQueries({ queryKey: ['users'] });
        toast.success('Account created successfully');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create account');
    },
  });

  const transferMutation = useMutation({
    mutationFn: districtAssignmentService.transferHead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['district-assignments'] });
      toast.success('District leader updated successfully');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update district leader');
    },
  });

  const districtsWithAssignments: DistrictWithAssignment[] = districts.map((district: any) => {
    const assignment = assignments.find((a: DistrictAssignment) =>
      a.districtId === district.id && a.status === 'ACTIVE'
    );
    return {
      ...district,
      currentHead: assignment ? {
        id: assignment.pastorId,
        fullName: assignment.pastorName,
        email: assignment.pastorEmail,
        startDate: assignment.startDate,
      } : null,
      status: assignment ? 'ACTIVE' : 'VACANT',
    };
  });

  const filteredDistricts = districtsWithAssignments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.currentHead?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.currentHead?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const assignedCount = districtsWithAssignments.filter(d => d.status === 'ACTIVE').length;
  const vacantCount = districtsWithAssignments.filter(d => d.status === 'VACANT').length;

  const openTransferModal = (district: DistrictWithAssignment) => {
    setSelectedDistrict(district);
    setNewHeadId('');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setReason('');
    setShowCreateAccount(false);
    setShowTransferModal(true);
  };

  const closeModal = () => {
    setShowTransferModal(false);
    setSelectedDistrict(null);
    setNewHeadId('');
    setEffectiveDate('');
    setReason('');
    setShowCreateAccount(false);
    setNewAccount({ fullName: '', email: '', phone: '', password: '' });
  };

  const handleTransfer = () => {
    if (!selectedDistrict || !newHeadId || !effectiveDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    transferMutation.mutate({
      districtId: selectedDistrict.id,
      newHeadPastorId: parseInt(newHeadId),
      effectiveDate,
      reason: reason || undefined,
    });
  };

  const handleCreateAccount = () => {
    if (!newAccount.fullName || !newAccount.email || !newAccount.password) {
      toast.error('Name, email and password are required');
      return;
    }
    createUserMutation.mutate({
      fullName: newAccount.fullName,
      email: newAccount.email,
      phone: newAccount.phone,
      password: newAccount.password,
      role: 'HEAD_OF_DISTRICT',
    });
  };

  const selectedNewHead = newHeadId === '__create__'
    ? null
    : headOfDistrictUsers.find((u: any) => String(u.id) === newHeadId);
  const isLoading = districtsLoading || assignmentsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Building2 size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              District Leadership
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 ml-14">
              Assign or change the leader responsible for each district. District data stays the same when the leader changes.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Districts</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? '...' : districts.length}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">With Leader</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? '...' : assignedCount}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Needs Leader</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? '...' : vacantCount}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search districts by name or leader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
          />
        </div>
      </div>

      {/* District Cards */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Districts ({filteredDistricts.length})
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Click on a district to change its leader
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredDistricts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Building2 size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No districts found</p>
            <p className="text-sm mt-1">
              {searchQuery ? 'Try a different search term' : 'No districts available'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {filteredDistricts.map((district) => (
              <div
                key={district.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                onClick={() => openTransferModal(district)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-xl ${district.status === 'ACTIVE' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                    <Building2 size={20} className={district.status === 'ACTIVE' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{district.name}</p>
                      {district.fieldName && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">in {district.fieldName}</span>
                      )}
                    </div>
                    {district.currentHead ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <User size={14} className="text-gray-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {district.currentHead.fullName}
                        </p>
                        <span className="text-gray-300 dark:text-gray-600 mx-1">|</span>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          Since {new Date(district.currentHead.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-medium">
                        No leader assigned
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    district.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {district.status === 'ACTIVE' ? 'Active' : 'Vacant'}
                  </span>
                  <ChevronRight size={18} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && selectedDistrict && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Change District Leader</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{selectedDistrict.name}</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info Banner */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-300">
                When you change the leader, all district data (churches, candidates, records) stays the same. Only the responsible leader changes.
              </div>

              {/* Transfer Visual Flow */}
              <div className="flex items-center gap-4">
                {/* Current Head */}
                <div className="flex-1 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User size={20} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Leader</p>
                  {selectedDistrict.currentHead ? (
                    <>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{selectedDistrict.currentHead.fullName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{selectedDistrict.currentHead.email}</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Vacant</p>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center gap-1">
                  <ArrowRight size={24} className="text-blue-500" />
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Changes to</span>
                </div>

                {/* New Head Preview */}
                <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border-2 border-dashed border-blue-200 dark:border-blue-800">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User size={20} className="text-blue-500 dark:text-blue-400" />
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">New Leader</p>
                  {selectedNewHead ? (
                    <>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{selectedNewHead.fullName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{selectedNewHead.email}</p>
                    </>
                  ) : showCreateAccount ? (
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">New account</p>
                  ) : (
                    <p className="text-sm text-blue-400 dark:text-blue-500 italic">Select below</p>
                  )}
                </div>
              </div>

              {/* New Head Selection or Create Account */}
              {showCreateAccount ? (
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <UserPlus size={16} /> Create New Leader Account
                    </h3>
                    <button
                      onClick={() => { setShowCreateAccount(false); setNewHeadId(''); }}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Choose existing instead
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={newAccount.fullName}
                    onChange={(e) => setNewAccount({ ...newAccount, fullName: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={newAccount.email}
                    onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={newAccount.phone}
                    onChange={(e) => setNewAccount({ ...newAccount, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="password"
                    placeholder="Password *"
                    value={newAccount.password}
                    onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                  />
                  <Button
                    variant="primary"
                    onClick={handleCreateAccount}
                    isLoading={createUserMutation.isPending}
                    disabled={!newAccount.fullName || !newAccount.email || !newAccount.password}
                    className="w-full"
                  >
                    Create & Assign
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Assign New Leader *
                    </label>
                    <button
                      onClick={() => setShowCreateAccount(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      <UserPlus size={14} /> Create new account
                    </button>
                  </div>
                  <select
                    value={newHeadId}
                    onChange={(e) => setNewHeadId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                    disabled={usersLoading}
                  >
                    <option value="">Choose a person...</option>
                    {headOfDistrictUsers.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} — {user.email}
                      </option>
                    ))}
                  </select>
                  {usersLoading && (
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <div className="animate-spin h-3 w-3 border border-gray-400 border-t-transparent rounded-full"></div>
                      Loading available leaders...
                    </p>
                  )}
                </div>
              )}

              {/* Effective Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Effective Date *
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Reason <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white resize-none text-sm"
                  placeholder="Why is this change being made?"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-slate-700">
              <Button variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={handleTransfer}
                isLoading={transferMutation.isPending}
                disabled={!newHeadId || !effectiveDate}
              >
                Confirm Change
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
