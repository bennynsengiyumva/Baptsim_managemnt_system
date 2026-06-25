import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import Card from '@/components/ui/Card';

import {
  selectCandidates,
  fetchCandidates,
} from '@/store/slices/candidateSlice';

import {
  fetchDashboardStats,
  selectDashboardLoading,
} from '@/store/slices/dashboardSlice';

import { selectUser } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import type { Candidate } from '@/types';

import {
  UserCheck,
  Waves,
  ArrowRightLeft,
  Building2,
} from 'lucide-react';

import { churchService, Church } from '@/services/churchService';

export default function OverviewDashboard({ title, subtitle }: any) {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const candidates: Candidate[] = useSelector(selectCandidates);
  const user = useSelector(selectUser);
  const statsLoading = useSelector(selectDashboardLoading);

  const [churches, setChurches] = useState<Church[]>([]);

  useEffect(() => {
    dispatch(fetchCandidates({}) as any);
    dispatch(fetchDashboardStats() as any);

    const loadChurches = async () => {
      try {
        const res = await churchService.getAllChurches();
        setChurches(res || []);
      } catch (err) {
        console.error('Failed to load churches', err);
      }
    };

    loadChurches();
  }, [dispatch]);

  // ================= KPI CARDS =================
  const kpis = [
    {
      title: 'Total Churches',
      value: churches.length,
      icon: Building2,
      color: 'bg-indigo-100 dark:bg-indigo-900',
      textColor: 'text-indigo-600 dark:text-indigo-300',
    },
    {
      title: 'Active Candidates',
      value: candidates.filter((c) => c.status !== 'BAPTIZED').length,
      icon: UserCheck,
      color: 'bg-green-100 dark:bg-green-900',
      textColor: 'text-green-600 dark:text-green-300',
    },
    {
      title: 'Baptized',
      value: candidates.filter((c) => c.status === 'BAPTIZED').length,
      icon: Waves,
      color: 'bg-purple-100 dark:bg-purple-900',
      textColor: 'text-purple-600 dark:text-purple-300',
    },
    {
      title: 'Pending Transfers',
      value: 0,
      icon: ArrowRightLeft,
      color: 'bg-orange-100 dark:bg-orange-900',
      textColor: 'text-orange-600 dark:text-orange-300',
    },
  ];

  const candidateStats = [
    {
      name: 'Registered',
      value: candidates.filter((c) => c.status === 'REGISTERED').length,
    },
    {
      name: 'In Progress',
      value: candidates.filter((c) => c.status === 'IN_PROGRESS').length,
    },
    {
      name: 'Ready',
      value: candidates.filter((c) => c.status === 'READY_FOR_BAPTISM').length,
    },
    {
      name: 'Baptized',
      value: candidates.filter((c) => c.status === 'BAPTIZED').length,
    },
  ];

  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          {subtitle || `Welcome back, ${user?.fullName || user?.email}!`}
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className={`${stat.color}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{stat.title}</p>

                  {statsLoading ? (
                    <div className="h-8 w-12 mt-2 bg-slate-200 rounded animate-pulse" />
                  ) : (
                    <p className={`text-3xl font-bold mt-2 ${stat.textColor}`}>
                      {stat.value}
                    </p>
                  )}
                </div>

                <Icon className={`${stat.textColor} opacity-50`} size={32} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t('dashboard.statistics')}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={candidateStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Candidate Pipeline">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={candidateStats}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label
              >
                {candidateStats.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}