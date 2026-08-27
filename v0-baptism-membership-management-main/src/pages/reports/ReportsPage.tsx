import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Church, Building2, MapPin, Printer, Loader2,
  FileText, FileDown, FileSpreadsheet, BookOpen, Award, Calendar,
  SlidersHorizontal, X, User, Users, GraduationCap, Shield,
  ClipboardCheck, AlertTriangle, CheckCircle2, Clock,
  Download, BarChart3, Activity, FileCheck, MessageSquare,
  ScrollText, TrendingUp, UserCheck
} from 'lucide-react';
import { churchService } from '@/services/churchService';
import { districtService } from '@/services/districtService';
import { fieldService } from '@/services/fieldService';
import { reportService } from '@/services/reportService';
import { Church as ChurchType, ChurchField, District } from '@/types';
import { selectUser } from '@/store/authStore';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

type ReportTab =
  | 'my-progress' | 'my-lessons' | 'my-baptism-status' | 'my-certificates' | 'my-membership'
  | 'assigned-candidates' | 'instructor-progress' | 'lesson-completion'
  | 'elder-baptism-requests' | 'elder-approved' | 'elder-ready'
  | 'pastor-events' | 'pastor-baptized' | 'pastor-certificates' | 'pastor-course-completion'
  | 'field-district-baptism' | 'field-certificate-stats' | 'field-instructor-activity'
  | 'rum-national' | 'rum-district-comparison'
  | 'admin-user-activity' | 'admin-auth' | 'admin-cert-downloads' | 'admin-messaging' | 'admin-audit'
  | 'church' | 'district' | 'field';

type TabGroup = 'candidate' | 'instructor' | 'elder' | 'pastor' | 'field' | 'rum' | 'admin' | 'hierarchy';

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const currentUser = useSelector(selectUser);
  const userRole = currentUser?.role as string | undefined;

  const STATUS_OPTIONS = useMemo(() => [
    { value: '', label: t('common.allStatuses') },
    { value: 'REGISTERED', label: t('common.registered') },
    { value: 'IN_PROGRESS', label: t('common.inProgress') },
    { value: 'READY_FOR_BAPTISM', label: t('common.readyForBaptism') },
    { value: 'BAPTISM_REQUEST_PENDING', label: t('common.baptismRequests') },
    { value: 'APPROVED_FOR_BAPTISM', label: t('common.approved') },
    { value: 'BAPTIZED', label: t('common.baptized') },
    { value: 'CERTIFICATE_GENERATED', label: t('common.certificates') },
    { value: 'CERTIFICATE_SIGNED', label: t('common.certificate') },
    { value: 'COURSE_COMPLETED', label: t('common.completed') },
    { value: 'TRANSFERRED_TO_CMS', label: t('common.cmsReadyCandidates') },
  ], [t]);

  const DATE_PRESETS = useMemo(() => [
    { value: '', label: t('common.allDates') },
    { value: 'today', label: t('common.today') },
    { value: 'week', label: t('common.week') },
    { value: 'month', label: t('common.month') },
    { value: 'quarter', label: t('common.quarterlyReport') },
    { value: 'year', label: t('common.annualReport') },
    { value: 'custom', label: t('common.date') },
  ], [t]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>('my-progress');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  // Hierarchy data
  const [churches, setChurches] = useState<ChurchType[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [fields, setFields] = useState<ChurchField[]>([]);
  const [selectedChurchId, setSelectedChurchId] = useState<number | ''>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | ''>('');
  const [selectedFieldId, setSelectedFieldId] = useState<number | ''>('');

  const role = userRole as string | undefined;
  const isInstructor = role === 'INSTRUCTOR';
  const isElder = role === 'FIRST_CHURCH_ELDER';
  const isPastor = role === 'PASTOR';
  const isHeadOfDistrict = role === 'HEAD_OF_DISTRICT';
  const isHeadOfField = role === 'HEAD_OF_FIELD';
  const isHeadOfRum = role === 'HEAD_OF_RUM';
  const isAdmin = role === 'ADMIN';

  // Determine tab group based on role
  const tabGroup: TabGroup = useMemo(() => {
    if (isAdmin) return 'admin';
    if (isHeadOfRum) return 'rum';
    if (isHeadOfField) return 'field';
    if (isHeadOfDistrict) return 'pastor';
    if (isPastor) return 'pastor';
    if (isElder) return 'elder';
    if (isInstructor) return 'instructor';
    return 'candidate';
  }, [isAdmin, isHeadOfRum, isHeadOfField, isHeadOfDistrict, isPastor, isElder, isInstructor]);

  // Define tabs per group
  const tabsByGroup = useMemo(() => {
    const groups: Record<TabGroup, { key: ReportTab; label: string; icon: React.ReactNode }[]> = {
      candidate: [
        { key: 'my-progress', label: 'My Progress', icon: <Award size={16} /> },
        { key: 'my-lessons', label: 'My Lessons', icon: <BookOpen size={16} /> },
        { key: 'my-baptism-status', label: 'My Baptism Status', icon: <CheckCircle2 size={16} /> },
        { key: 'my-certificates', label: 'My Certificates', icon: <ScrollText size={16} /> },
        { key: 'my-membership', label: 'My Membership', icon: <User size={16} /> },
      ],
      instructor: [
        { key: 'assigned-candidates', label: 'Assigned Candidates', icon: <Users size={16} /> },
        { key: 'instructor-progress', label: 'Candidate Progress', icon: <TrendingUp size={16} /> },
        { key: 'lesson-completion', label: 'Lesson Completion', icon: <ClipboardCheck size={16} /> },
      ],
      elder: [
        { key: 'elder-baptism-requests', label: 'Baptism Requests', icon: <AlertTriangle size={16} /> },
        { key: 'elder-approved', label: 'Approved Candidates', icon: <UserCheck size={16} /> },
        { key: 'elder-ready', label: 'Candidates Ready', icon: <CheckCircle2 size={16} /> },
      ],
      pastor: [
        { key: 'pastor-events', label: 'Baptism Events', icon: <Calendar size={16} /> },
        { key: 'pastor-baptized', label: 'Baptized Candidates', icon: <Award size={16} /> },
        { key: 'pastor-certificates', label: 'Certificate Signing', icon: <FileCheck size={16} /> },
        { key: 'pastor-course-completion', label: 'Course Completion', icon: <GraduationCap size={16} /> },
        { key: 'church', label: 'Church Report', icon: <Church size={16} /> },
      ],
      field: [
        { key: 'field-district-baptism', label: 'District Baptism', icon: <Building2 size={16} /> },
        { key: 'field-certificate-stats', label: 'Certificate Stats', icon: <ScrollText size={16} /> },
        { key: 'field-instructor-activity', label: 'Instructor Activity', icon: <Activity size={16} /> },
        { key: 'district', label: 'District Report', icon: <Building2 size={16} /> },
        { key: 'church', label: 'Church Report', icon: <Church size={16} /> },
      ],
      rum: [
        { key: 'rum-national', label: 'National Baptism', icon: <BarChart3 size={16} /> },
        { key: 'rum-district-comparison', label: 'District Comparison', icon: <TrendingUp size={16} /> },
        { key: 'field', label: 'Field Report', icon: <MapPin size={16} /> },
        { key: 'district', label: 'District Report', icon: <Building2 size={16} /> },
      ],
      admin: [
        { key: 'pastor-events', label: 'Baptism Events', icon: <Calendar size={16} /> },
        { key: 'pastor-baptized', label: 'Baptized Candidates', icon: <Award size={16} /> },
        { key: 'pastor-certificates', label: 'Certificate Signing', icon: <FileCheck size={16} /> },
        { key: 'pastor-course-completion', label: 'Course Completion', icon: <GraduationCap size={16} /> },
        { key: 'church', label: 'Church Report', icon: <Church size={16} /> },
        { key: 'district', label: 'District Report', icon: <Building2 size={16} /> },
        { key: 'field', label: 'Field Report', icon: <MapPin size={16} /> },
        { key: 'admin-user-activity', label: 'User Activity', icon: <Users size={16} /> },
        { key: 'admin-auth', label: 'Auth Report', icon: <Shield size={16} /> },
        { key: 'admin-cert-downloads', label: 'Certificate Downloads', icon: <Download size={16} /> },
        { key: 'admin-messaging', label: 'Messaging Report', icon: <MessageSquare size={16} /> },
        { key: 'admin-audit', label: 'Audit Logs', icon: <ScrollText size={16} /> },
      ],
      hierarchy: [
        { key: 'church', label: 'Church Report', icon: <Church size={16} /> },
        { key: 'district', label: 'District Report', icon: <Building2 size={16} /> },
        { key: 'field', label: 'Field Report', icon: <MapPin size={16} /> },
      ],
    };
    return groups[tabGroup] || groups.hierarchy;
  }, [tabGroup]);

  // Apply date preset
  useEffect(() => {
    if (!datePreset || datePreset === 'custom') return;
    const now = new Date();
    let from = '';
    const to = now.toISOString().split('T')[0];
    if (datePreset === 'today') {
      from = to;
    } else if (datePreset === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      from = d.toISOString().split('T')[0];
    } else if (datePreset === 'month') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      from = d.toISOString().split('T')[0];
    } else if (datePreset === 'quarter') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      from = d.toISOString().split('T')[0];
    } else if (datePreset === 'year') {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      from = d.toISOString().split('T')[0];
    }
    setDateFrom(from);
    setDateTo(to);
  }, [datePreset]);

  // Auto-load hierarchy data for admin/field roles
  useEffect(() => {
    const loadData = async () => {
      if (isAdmin || isHeadOfField || isHeadOfRum || isHeadOfDistrict) {
        try {
          const [c, d, f] = await Promise.all([
            churchService.getAllChurches(),
            districtService.getAll(),
            fieldService.getAll(),
          ]);
          setChurches(c);
          setDistricts(d);
          setFields(f);
        } catch {
          // Silently fail - hierarchy not needed for all reports
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };
    loadData();
  }, [isAdmin, isHeadOfField, isHeadOfRum, isHeadOfDistrict]);

  // Auto-filter scope for restricted roles
  useEffect(() => {
    if (!currentUser) return;
    if (isPastor && currentUser.churchId) {
      setSelectedChurchId(currentUser.churchId);
    }
    if (isHeadOfDistrict && currentUser.districtId) {
      setSelectedDistrictId(currentUser.districtId);
    }
    if (isHeadOfField && currentUser.fieldId) {
      setSelectedFieldId(currentUser.fieldId);
    }
    setInitialLoading(false);
  }, [currentUser, isPastor, isHeadOfDistrict, isHeadOfField]);

  // Reset report data when tab changes
  useEffect(() => {
    setReportData(null);
    setViewMode('summary');
  }, [activeTab]);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setReportData(null);
    try {
      let data: any = null;
      const status = statusFilter || undefined;

      switch (activeTab) {
        // Candidate reports
        case 'my-progress':
          data = await reportService.getCandidateMyProgress(dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'my-lessons':
          data = await reportService.getCandidateMyLessons(dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'my-baptism-status':
          data = await reportService.getCandidateMyBaptismStatus(dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'my-certificates':
          data = await reportService.getCandidateMyCertificates(dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'my-membership':
          data = await reportService.getCandidateMyMembership(dateFrom || undefined, dateTo || undefined, status);
          break;

        // Instructor reports
        case 'assigned-candidates':
          data = await reportService.getInstructorAssignedCandidates(dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'instructor-progress':
          data = await reportService.getInstructorCandidateProgress(undefined, dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'lesson-completion':
          data = await reportService.getInstructorLessonCompletion(dateFrom || undefined, dateTo || undefined, status);
          break;

        // Elder reports
        case 'elder-baptism-requests':
          data = await reportService.getElderBaptismRequests(dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'elder-approved':
          data = await reportService.getElderApprovedCandidates(dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'elder-ready':
          data = await reportService.getElderCandidatesReady(dateFrom || undefined, dateTo || undefined, status);
          break;

        // Pastor reports
        case 'pastor-events':
          data = await reportService.getPastorBaptismEvents(dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'pastor-baptized':
          data = await reportService.getPastorBaptizedCandidates(dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'pastor-certificates':
          data = await reportService.getPastorCertificateSigning(dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'pastor-course-completion':
          data = await reportService.getPastorCourseCompletion(dateFrom || undefined, dateTo || undefined, status);
          break;

        // Field reports
        case 'field-district-baptism':
          data = await reportService.getFieldDistrictBaptism(dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'field-certificate-stats':
          data = await reportService.getFieldCertificateStats(dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'field-instructor-activity':
          data = await reportService.getFieldInstructorActivity(dateFrom || undefined, dateTo || undefined, status);
          break;

        // RUM reports
        case 'rum-national':
          data = await reportService.getRumNationalBaptism(dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'rum-district-comparison':
          data = await reportService.getRumDistrictComparison(dateFrom || undefined, dateTo || undefined, status);
          break;

        // Admin reports
        case 'admin-user-activity':
          data = await reportService.getAdminUserActivity(dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'admin-auth':
          data = await reportService.getAdminAuthReport(dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'admin-cert-downloads':
          data = await reportService.getAdminCertificateDownloads(dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'admin-messaging':
          data = await reportService.getAdminMessagingReport(dateFrom || undefined, dateTo || undefined, status);
          break;
        case 'admin-audit':
          data = await reportService.getAdminAuditLogs(dateFrom || undefined, dateTo || undefined);
          break;

        // Hierarchy reports
        case 'church':
          if (selectedChurchId) {
            const detail = await churchService.getChurchDetail(Number(selectedChurchId), dateFrom || undefined, dateTo || undefined);
            let records = detail?.candidates || [];
            if (statusFilter) {
              records = records.filter((r: any) => r.status === statusFilter);
            }
            data = {
              title: 'Church Report',
              records,
              columnHeaders: ['#', 'Name', 'Email', 'Phone', 'Church', 'Status', 'Baptism Date', 'Registered'],
              summary: detail?.progress || {},
            };
          }
          break;
        case 'district':
          if (selectedDistrictId) {
            data = await reportService.generateDistrictReport(Number(selectedDistrictId), dateFrom || undefined, dateTo || undefined, status);
          }
          break;
        case 'field':
          if (selectedFieldId) {
            data = await reportService.generateFieldReport(Number(selectedFieldId), dateFrom || undefined, dateTo || undefined, status);
          }
          break;
      }

      setReportData(data);
      toast.success('Report loaded successfully');
    } catch (error) {
      console.error('Report fetch error:', error);
      toast.error('Failed to load report');
    }
    setLoading(false);
  }, [activeTab, dateFrom, dateTo, statusFilter, selectedChurchId, selectedDistrictId, selectedFieldId]);

  const handleExportPdf = async () => {
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (selectedChurchId) params.churchId = String(selectedChurchId);
      if (selectedDistrictId) params.districtId = String(selectedDistrictId);
      if (selectedFieldId) params.fieldId = String(selectedFieldId);
      await reportService.exportPdf(activeTab, params);
      toast.success('PDF exported');
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (selectedChurchId) params.churchId = String(selectedChurchId);
      if (selectedDistrictId) params.districtId = String(selectedDistrictId);
      if (selectedFieldId) params.fieldId = String(selectedFieldId);
      await reportService.exportExcel(activeTab, params);
      toast.success('Excel exported');
    } catch {
      toast.error('Failed to export Excel');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups for printing.');
      return;
    }

    const tabLabel = tabsByGroup.find(t => t.key === activeTab)?.label || 'Report';
    const records = reportData?.records || reportData?.data || [];
    const rowsHtml = Array.isArray(records) && records.length > 0
      ? records.map((r: any, i: number) => `
        <tr>
          <td style="border:1px solid #ccc;padding:8px;text-align:left">${i + 1}</td>
          <td style="border:1px solid #ccc;padding:8px;text-align:left">${r.fullName || r.candidateName || r.name || r.title || '-'}</td>
          <td style="border:1px solid #ccc;padding:8px;text-align:left">${r.email || r.churchName || r.districtName || '-'}</td>
          <td style="border:1px solid #ccc;padding:8px;text-align:center">${r.status || '-'}</td>
          <td style="border:1px solid #ccc;padding:8px;text-align:center">${r.baptismDate || r.date || r.createdAt ? new Date(r.baptismDate || r.date || r.createdAt).toLocaleDateString() : '-'}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="5" style="border:1px solid #ccc;padding:16px;text-align:center">No records found</td></tr>';

    printWindow.document.write(`
      <html>
      <head>
        <title>${tabLabel} Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
          h1 { font-size: 24px; margin-bottom: 4px; }
          .subtitle { color: #64748b; margin-bottom: 24px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #f1f5f9; border: 1px solid #ccc; padding: 10px 8px; text-align: left; font-size: 13px; }
          td { border: 1px solid #ccc; padding: 8px; font-size: 13px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${tabLabel} Report</h1>
        <p class="subtitle">Generated By: ${currentUser?.fullName || 'System'} | Generated On: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Details</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
    toast.success('Print window opened');
  };

  // Get report title for current tab
  const getReportTitle = () => {
    return tabsByGroup.find(t => t.key === activeTab)?.label || 'Report';
  };

  // Extract summary stats from report data
  const getSummaryStats = (): StatCard[] => {
    if (!reportData) return [];

    const summary = reportData.summary || reportData;
    const records = reportData.records || reportData.data || [];

    const statConfigs: Record<string, StatCard[]> = {
      'my-progress': [
        {
          label: 'Overall Progress',
          value: `${summary.progress || summary.overallProgress || 0}%`,
          icon: <TrendingUp size={20} />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
          label: 'Status',
          value: summary.status || 'N/A',
          icon: <CheckCircle2 size={20} />,
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
        },
        {
          label: 'Lessons Completed',
          value: summary.completedLessons ?? summary.completed ?? 0,
          icon: <BookOpen size={20} />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        },
      ],
      'my-lessons': [
        {
          label: 'Total Lessons',
          value: summary.totalLessons ?? records.length ?? 0,
          icon: <BookOpen size={20} />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
          label: 'Completed',
          value: summary.completedLessons ?? records.filter((r: any) => r.completed).length ?? 0,
          icon: <CheckCircle2 size={20} />,
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
        },
        {
          label: 'Average Score',
          value: summary.averageScore ?? 'N/A',
          icon: <Award size={20} />,
          color: 'text-amber-600',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        },
      ],
      'my-baptism-status': [
        {
          label: 'Baptism Status',
          value: summary.status || 'N/A',
          icon: <CheckCircle2 size={20} />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
          label: 'Baptism Date',
          value: summary.baptismDate || 'Not Scheduled',
          icon: <Calendar size={20} />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        },
      ],
      'my-certificates': [
        {
          label: 'Total Certificates',
          value: summary.totalCertificates ?? records.length ?? 0,
          icon: <ScrollText size={20} />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
          label: 'Signed',
          value: summary.signed ?? records.filter((r: any) => r.certificateSigned).length ?? 0,
          icon: <FileCheck size={20} />,
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
        },
      ],
      'my-membership': [
        {
          label: 'Membership Status',
          value: summary.status || 'N/A',
          icon: <User size={20} />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
          label: 'Member Since',
          value: summary.joinDate || 'N/A',
          icon: <Calendar size={20} />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        },
      ],
    };

    if (statConfigs[activeTab]) return statConfigs[activeTab];

    // Generic stats for role-based reports
    const totalRecords = Array.isArray(records) ? records.length : 0;
    const stats: StatCard[] = [
      {
        label: 'Total Records',
        value: totalRecords,
        icon: <FileText size={20} />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      },
    ];

    if (summary.totalCandidates) {
      stats.push({
        label: 'Total Candidates',
        value: summary.totalCandidates,
        icon: <Users size={20} />,
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
      });
    }
    if (summary.baptized) {
      stats.push({
        label: 'Baptized',
        value: summary.baptized,
        icon: <Award size={20} />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      });
    }
    if (summary.inProgress) {
      stats.push({
        label: 'In Progress',
        value: summary.inProgress,
        icon: <Clock size={20} />,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      });
    }

    return stats;
  };

  const summaryStats = getSummaryStats();
  const records = reportData?.records || reportData?.data || [];
  const columnHeaders = reportData?.columnHeaders || reportData?.columns || null;
  const hasRecords = Array.isArray(records) && records.length > 0;
  const needsHierarchy = ['church', 'district', 'field'].includes(activeTab);

  return (
    <div className="space-y-6">
      {/* Initial Loading State */}
      {initialLoading && (
        <LoadingSpinner fullPage text="Loading report data..." />
      )}

      {!initialLoading && (
      <>
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText size={24} className="text-primary" />
              Reports
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              View and export role-based reports
            </p>
          </div>
          <div className="text-right text-sm text-gray-500 dark:text-gray-400">
            <p>Logged in as: <span className="font-medium text-gray-700 dark:text-gray-300">{currentUser?.fullName}</span></p>
            <p>Role: <span className="font-medium text-gray-700 dark:text-gray-300">{role?.replace(/_/g, ' ')}</span></p>
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-slate-700">
          {tabsByGroup.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); }}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Filters & Actions Row */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {/* Date Presets */}
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <div className="flex flex-wrap gap-1.5">
                {DATE_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => setDatePreset(preset.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      datePreset === preset.value
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range */}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>
            )}

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                showFilters || statusFilter
                  ? 'bg-primary/10 text-primary'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              <SlidersHorizontal size={14} />
              Filters
              {statusFilter && (
                <span className="w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center">1</span>
              )}
            </button>
            {statusFilter && (
              <button
                onClick={() => setStatusFilter('')}
                className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-700"
              >
                <X size={12} /> Clear
              </button>
            )}

            <div className="flex-1" />

            {/* Hierarchy Selectors */}
            {needsHierarchy && (
              <div className="flex items-center gap-2">
                {activeTab === 'church' && (
                  <select
                    value={selectedChurchId}
                    onChange={(e) => setSelectedChurchId(e.target.value ? Number(e.target.value) : '')}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Church</option>
                    {churches.map((ch) => (
                      <option key={ch.id} value={ch.id}>{ch.churchName}</option>
                    ))}
                  </select>
                )}
                {activeTab === 'district' && (
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => setSelectedDistrictId(e.target.value ? Number(e.target.value) : '')}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select District</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                )}
                {activeTab === 'field' && (
                  <select
                    value={selectedFieldId}
                    onChange={(e) => setSelectedFieldId(e.target.value ? Number(e.target.value) : '')}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Field</option>
                    {fields.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={fetchReportData}
              disabled={loading || (needsHierarchy && activeTab === 'church' && !selectedChurchId) || (needsHierarchy && activeTab === 'district' && !selectedDistrictId) || (needsHierarchy && activeTab === 'field' && !selectedFieldId)}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Report Header */}
          {reportData && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{getReportTitle()} Report</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Generated By: {currentUser?.fullName} | Generated On: {new Date().toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex bg-gray-200 dark:bg-slate-600 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('summary')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        viewMode === 'summary' ? 'bg-white dark:bg-slate-500 text-gray-900 dark:text-white shadow' : 'text-gray-500'
                      }`}
                    >
                      Summary
                    </button>
                    <button
                      onClick={() => setViewMode('detailed')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        viewMode === 'detailed' ? 'bg-white dark:bg-slate-500 text-gray-900 dark:text-white shadow' : 'text-gray-500'
                      }`}
                    >
                      Detailed
                    </button>
                  </div>
                  {/* Export Buttons */}
                  <button
                    onClick={handleExportPdf}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <FileDown size={14} /> PDF
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    <FileSpreadsheet size={14} /> Excel
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <Printer size={14} /> Print
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Summary Statistics Cards */}
          {reportData && summaryStats.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {summaryStats.map((stat, i) => (
                <Card key={i}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <span className={stat.color}>{stat.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Results */}
          {reportData && (
            <div>
              {hasRecords ? (
                viewMode === 'summary' ? (
                  <SummaryTable records={records} columnHeaders={columnHeaders} statusFilter={statusFilter} />
                ) : (
                  <DetailedTable records={records} />
                )
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No records found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or date range</p>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 size={48} className="mx-auto mb-4 animate-spin text-primary" />
              <p className="text-gray-500 dark:text-gray-400">Generating report...</p>
            </div>
          )}

          {/* Empty State */}
          {!reportData && !loading && (
            <div className="text-center py-16 text-gray-400">
              <BarChart3 size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Select report type and click Generate Report</p>
              <p className="text-sm mt-2">Choose from the tabs above and configure date filters as needed</p>
            </div>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}

// Summary Table Component
function SummaryTable({ records, columnHeaders, statusFilter }: { records: any[]; columnHeaders?: string[] | null; statusFilter: string }) {
  const filtered = statusFilter
    ? records.filter((r) => r.status === statusFilter)
    : records;

  const cols = columnHeaders && columnHeaders.length > 0
    ? columnHeaders
    : Object.keys(filtered[0] || {});

  const formatCell = (value: any): string => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      try { return new Date(value).toLocaleDateString(); } catch { return value; }
    }
    return String(value);
  };

  const isCompactCol = (col: string) => /^#$|status|date|registrations|approved|signed|completion|phone|role|success|count|action|email/i.test(col);

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
      <table className="w-full text-xs border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            {cols.map((col) => (
              <th key={col} className={`py-2.5 px-3 font-semibold text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap ${col === '#' ? 'w-10 text-center' : isCompactCol(col) ? 'w-24 text-left' : 'text-left'}`}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((record, i) => (
            <tr key={record.id || i} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
              {cols.map((col) => {
                const val = record[col];
                if (col === '#') {
                  return <td key={col} className="py-2 px-3 text-center text-gray-500 whitespace-nowrap">{i + 1}</td>;
                }
                if (col.toLowerCase() === 'status') {
                  return <td key={col} className="py-2 px-3 text-center whitespace-nowrap"><StatusBadge status={val} /></td>;
                }
                const display = formatCell(val);
                const compact = isCompactCol(col);
                return (
                  <td key={col} className={`py-2 px-3 min-w-0 ${compact ? 'whitespace-nowrap text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300 break-words'}`}>
                    <span className="block truncate text-[11px] leading-tight" title={display}>{display}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 font-semibold">
            <td colSpan={cols.length - 1} className="py-2.5 px-3 text-gray-700 dark:text-gray-300 text-xs">Total</td>
            <td className="py-2.5 px-3 text-right text-gray-700 dark:text-gray-300 text-xs">{filtered.length} records</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// Detailed Table Component
function DetailedTable({ records }: { records: any[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
      <table className="w-full text-xs border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <th className="text-left py-2.5 px-3 font-semibold text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 w-10 text-center">#</th>
            <th className="text-left py-2.5 px-3 font-semibold text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 w-1/4">Name</th>
            <th className="text-left py-2.5 px-3 font-semibold text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 w-1/4">Email</th>
            <th className="text-left py-2.5 px-3 font-semibold text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 w-1/5">Church</th>
            <th className="text-center py-2.5 px-3 font-semibold text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 w-24">Status</th>
            <th className="text-center py-2.5 px-3 font-semibold text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 w-24">Baptism Date</th>
            <th className="text-center py-2.5 px-3 font-semibold text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 w-24">Registered</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, i) => (
            <tr key={record.id || i} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
              <td className="py-2 px-3 text-center text-gray-500 whitespace-nowrap text-[11px]">{i + 1}</td>
              <td className="py-2 px-3 font-medium text-gray-900 dark:text-white min-w-0">
                <span className="block truncate text-[11px] leading-tight" title={record.fullName || record.candidateName || record.name || '-'}>
                  {record.fullName || record.candidateName || record.name || '-'}
                </span>
              </td>
              <td className="py-2 px-3 text-gray-600 dark:text-gray-400 min-w-0">
                <span className="block truncate text-[11px] leading-tight" title={record.email || '-'}>{record.email || '-'}</span>
              </td>
              <td className="py-2 px-3 text-gray-600 dark:text-gray-400 min-w-0">
                <span className="block truncate text-[11px] leading-tight" title={record.churchName || '-'}>{record.churchName || '-'}</span>
              </td>
              <td className="py-2 px-3 text-center whitespace-nowrap">
                <StatusBadge status={record.status} />
              </td>
              <td className="py-2 px-3 text-center text-gray-600 whitespace-nowrap text-[11px]">{record.baptismDate || '-'}</td>
              <td className="py-2 px-3 text-center text-gray-500 whitespace-nowrap text-[11px]">
                {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  if (!status) return <span className="text-gray-400">-</span>;

  const colorMap: Record<string, string> = {
    BAPTIZED: 'bg-green-100 text-green-700',
    CERTIFICATE_SIGNED: 'bg-green-100 text-green-700',
    APPROVED_FOR_BAPTISM: 'bg-blue-100 text-blue-700',
    READY_FOR_BAPTISM: 'bg-purple-100 text-purple-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    REGISTERED: 'bg-slate-100 text-slate-700',
    BAPTISM_REQUEST_PENDING: 'bg-orange-100 text-orange-700',
    CERTIFICATE_GENERATED: 'bg-teal-100 text-teal-700',
    TRANSFERRED_TO_CMS: 'bg-indigo-100 text-indigo-700',
    COURSE_COMPLETED: 'bg-emerald-100 text-emerald-700',
    ACTIVE: 'bg-green-100 text-green-700',
    INACTIVE: 'bg-gray-100 text-gray-700',
    SUSPENDED: 'bg-red-100 text-red-700',
  };

  const colorClass = colorMap[status] || 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium leading-tight ${colorClass}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
