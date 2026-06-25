import { useState, useEffect } from 'react';
import {
  Church, Building2, MapPin, Printer, Loader2,
  FileText, Filter, FileDown, FileSpreadsheet
} from 'lucide-react';
import { churchService } from '@/services/churchService';
import { districtService } from '@/services/districtService';
import { fieldService } from '@/services/fieldService';
import { reportService } from '@/services/reportService';
import { Church as ChurchType, ChurchField, District } from '@/types';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

type Tab = 'church' | 'district' | 'field';

interface ReportRow {
  church: string;
  district: string;
  field: string;
  totalCandidates: number;
  baptized: number;
  inProgress: number;
  readyForBaptism: number;
  futureDated: number;
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('church');

  const [churches, setChurches] = useState<ChurchType[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [fields, setFields] = useState<ChurchField[]>([]);

  const [selectedChurchId, setSelectedChurchId] = useState<number | ''>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | ''>('');
  const [selectedFieldId, setSelectedFieldId] = useState<number | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    const loadData = async () => {
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
        toast.error('Failed to load report data');
      }
    };
    loadData();
  }, []);

  const getChurchDetailWithProgress = async (churchId: number) => {
    try {
      const detail = await churchService.getChurchDetail(churchId, dateFrom || undefined, dateTo || undefined);
      return detail;
    } catch {
      return null;
    }
  };

  const generateChurchReport = async () => {
    if (!selectedChurchId) return;
    setLoading(true);
    setGenerated(false);
    try {
      const detail = await getChurchDetailWithProgress(Number(selectedChurchId));
      if (!detail) {
        toast.error('Failed to fetch church data');
        return;
      }
      const church = churches.find(c => c.id === selectedChurchId);
      setReportRows([{
        church: church?.churchName || detail.church.churchName,
        district: church?.districtName || detail.church.districtName || 'N/A',
        field: church?.fieldName || detail.church.fieldName || 'N/A',
        totalCandidates: detail.progress.totalCandidates,
        baptized: detail.progress.baptized,
        inProgress: detail.progress.inProgress,
        readyForBaptism: detail.progress.readyForBaptism,
        futureDated: detail.progress.futureDated,
      }]);
      setGenerated(true);
      toast.success('Church report generated');
    } catch {
      toast.error('Failed to generate church report');
    }
    setLoading(false);
  };

  const generateDistrictReport = async () => {
    if (!selectedDistrictId) return;
    setLoading(true);
    setGenerated(false);
    try {
      const districtChurches = await churchService.getChurchesByDistrict(Number(selectedDistrictId));
      const district = districts.find(d => d.id === selectedDistrictId);
      const rows: ReportRow[] = [];
      for (const ch of districtChurches) {
        const detail = await getChurchDetailWithProgress(ch.id);
        if (detail) {
          rows.push({
            church: ch.churchName,
            district: district?.name || ch.districtName || 'N/A',
            field: ch.fieldName || 'N/A',
            totalCandidates: detail.progress.totalCandidates,
            baptized: detail.progress.baptized,
            inProgress: detail.progress.inProgress,
            readyForBaptism: detail.progress.readyForBaptism,
            futureDated: detail.progress.futureDated,
          });
        }
      }
      setReportRows(rows);
      setGenerated(true);
      toast.success(`District report generated (${rows.length} churches)`);
    } catch {
      toast.error('Failed to generate district report');
    }
    setLoading(false);
  };

  const generateFieldReport = async () => {
    if (!selectedFieldId) return;
    setLoading(true);
    setGenerated(false);
    try {
      const fieldDistricts = await districtService.getByField(Number(selectedFieldId));
      const field = fields.find(f => f.id === selectedFieldId);
      const rows: ReportRow[] = [];
      for (const dist of fieldDistricts) {
        const districtChurches = await churchService.getChurchesByDistrict(dist.id);
        for (const ch of districtChurches) {
          const detail = await getChurchDetailWithProgress(ch.id);
          if (detail) {
            rows.push({
              church: ch.churchName,
              district: dist.name,
              field: field?.name || ch.fieldName || 'N/A',
              totalCandidates: detail.progress.totalCandidates,
              baptized: detail.progress.baptized,
              inProgress: detail.progress.inProgress,
              readyForBaptism: detail.progress.readyForBaptism,
              futureDated: detail.progress.futureDated,
            });
          }
        }
      }
      setReportRows(rows);
      setGenerated(true);
      toast.success(`Field report generated (${rows.length} churches)`);
    } catch {
      toast.error('Failed to generate field report');
    }
    setLoading(false);
  };

  const handleGenerate = () => {
    if (activeTab === 'church') generateChurchReport();
    else if (activeTab === 'district') generateDistrictReport();
    else if (activeTab === 'field') generateFieldReport();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups for printing.');
      return;
    }
    const tabLabel = activeTab === 'church' ? t('common.churchColumn') : activeTab === 'district' ? t('common.districtColumn') : t('common.fieldColumn');
    const rowsHtml = reportRows.map(r => `
      <tr>
        <td style="border:1px solid #ccc;padding:8px;text-align:left">${r.church}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:left">${r.district}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:left">${r.field}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:center">${r.totalCandidates}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:center">${r.baptized}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:center">${r.inProgress}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:center">${r.readyForBaptism}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:center">${r.futureDated > 0 ? t('common.futureBadge') + ' (' + r.futureDated + ')' : r.futureDated}</td>
      </tr>
    `).join('');
    const total = reportRows.reduce((s, r) => ({
      totalCandidates: s.totalCandidates + r.totalCandidates,
      baptized: s.baptized + r.baptized,
      inProgress: s.inProgress + r.inProgress,
      readyForBaptism: s.readyForBaptism + r.readyForBaptism,
      futureDated: s.futureDated + r.futureDated,
    }), { totalCandidates: 0, baptized: 0, inProgress: 0, readyForBaptism: 0, futureDated: 0 });

    printWindow.document.write(`
      <html>
      <head>
        <title>${t('common.reportTitle', { type: tabLabel })}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #1e293b; font-size: 24px; margin-bottom: 4px; }
          p.subtitle { color: #64748b; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f1f5f9; border:1px solid #ccc; padding: 10px 8px; text-align: left; font-size: 13px; }
          td { font-size: 13px; }
          .totals { margin-top: 20px; display: flex; gap: 16px; }
          .totals div { background: #f8fafc; padding: 12px 16px; border-radius: 8px; flex: 1; text-align: center; }
          .totals strong { display: block; font-size: 20px; color: #0f172a; }
          .totals span { font-size: 12px; color: #64748b; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${t('common.reportTitle', { type: tabLabel })}</h1>
        <p class="subtitle">${t('common.generatedOn', { date: new Date().toLocaleDateString() })}${dateFrom ? ' | ' + t('common.fromDate') + ': ' + dateFrom : ''}${dateTo ? ' | ' + t('common.toDate') + ': ' + dateTo : ''} | ${reportRows.length} ${t('common.churchesCount')}</p>
        <table>
          <thead>
            <tr>
              <th>${t('common.churchColumn')}</th>
              <th>${t('common.districtColumn')}</th>
              <th>${t('common.fieldColumn')}</th>
              <th style="text-align:center">${t('common.totalShort')}</th>
              <th style="text-align:center">${t('common.baptizedColumn')}</th>
              <th style="text-align:center">${t('common.inProgressColumn')}</th>
              <th style="text-align:center">${t('common.readyColumn')}</th>
              <th style="text-align:center">${t('common.futureColumn')}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="totals">
          <div><strong>${total.totalCandidates}</strong><span>${t('common.totalCandidates')}</span></div>
          <div><strong>${total.baptized}</strong><span>${t('common.baptizedColumn')}</span></div>
          <div><strong>${total.inProgress}</strong><span>${t('common.inProgress')}</span></div>
          <div><strong>${total.readyForBaptism}</strong><span>${t('common.readyForBaptism')}</span></div>
          <div><strong>${total.futureDated}</strong><span>${t('common.futureDatedLabel')}</span></div>
        </div>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
    toast.success('Report exported');
  };

  const handleDownloadPDF = async () => {
    try {
      if (activeTab === 'church' && selectedChurchId) {
        await reportService.downloadChurchReport(Number(selectedChurchId), dateFrom || undefined, dateTo || undefined, 'pdf');
      } else if (activeTab === 'district' && selectedDistrictId) {
        await reportService.downloadDistrictReport(Number(selectedDistrictId), dateFrom || undefined, dateTo || undefined, 'pdf');
      } else if (activeTab === 'field' && selectedFieldId) {
        await reportService.downloadFieldReport(Number(selectedFieldId), dateFrom || undefined, dateTo || undefined, 'pdf');
      }
      toast.success('PDF report downloaded');
    } catch {
      toast.error('Failed to download PDF report');
    }
  };

  const handleDownloadExcel = async () => {
    try {
      if (activeTab === 'church' && selectedChurchId) {
        await reportService.downloadChurchReport(Number(selectedChurchId), dateFrom || undefined, dateTo || undefined, 'excel');
      } else if (activeTab === 'district' && selectedDistrictId) {
        await reportService.downloadDistrictReport(Number(selectedDistrictId), dateFrom || undefined, dateTo || undefined, 'excel');
      } else if (activeTab === 'field' && selectedFieldId) {
        await reportService.downloadFieldReport(Number(selectedFieldId), dateFrom || undefined, dateTo || undefined, 'excel');
      }
      toast.success('Excel report downloaded');
    } catch {
      toast.error('Failed to download Excel report');
    }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'church', label: t('common.byChurch'), icon: Church },
    { key: 'district', label: t('common.byDistrict'), icon: Building2 },
    { key: 'field', label: t('common.byField'), icon: MapPin },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText size={24} className="text-primary" />
          {t('common.reports')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t('common.reportsDescription')}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setGenerated(false); setReportRows([]); }}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Date Range */}
          <div className="flex items-end gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{t('common.fromDate')}</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{t('common.toDate')}</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="px-3 py-2.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {t('common.clear')}
              </button>
            )}
          </div>

          {/* Selection */}
          <div className="flex items-end gap-4 mb-6">
            {activeTab === 'church' && (
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{t('common.selectChurch')}</label>
                <select
                  value={selectedChurchId}
                  onChange={e => setSelectedChurchId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                >
                  <option value="">{t('common.chooseChurch')}</option>
                  {churches.map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.churchName} {ch.districtName ? `(${ch.districtName})` : ''}</option>
                  ))}
                </select>
              </div>
            )}
            {activeTab === 'district' && (
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{t('common.selectDistrict')}</label>
                <select
                  value={selectedDistrictId}
                  onChange={e => setSelectedDistrictId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                >
                  <option value="">{t('common.chooseDistrict')}</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
            {activeTab === 'field' && (
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{t('common.selectField')}</label>
                <select
                  value={selectedFieldId}
                  onChange={e => setSelectedFieldId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                >
                  <option value="">{t('common.chooseField')}</option>
                  {fields.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={handleGenerate}
              disabled={loading || (activeTab === 'church' && !selectedChurchId) || (activeTab === 'district' && !selectedDistrictId) || (activeTab === 'field' && !selectedFieldId)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Filter size={16} />}
              {loading ? t('common.generating') : t('common.generate')}
            </button>
          </div>

          {/* Results Table */}
          {generated && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('common.churchesFound', { count: reportRows.length })}
                </p>
                {reportRows.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadPDF}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <FileDown size={16} />
                      {t('common.pdf')}
                    </button>
                    <button
                      onClick={handleDownloadExcel}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                    >
                      <FileSpreadsheet size={16} />
                      {t('common.excel')}
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <Printer size={16} />
                      {t('common.print')}
                    </button>
                  </div>
                )}
              </div>
              {reportRows.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">{t('common.noDataFound')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">{t('common.churchColumn')}</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">{t('common.districtColumn')}</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">{t('common.fieldColumn')}</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">{t('common.totalShort')}</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">{t('common.baptizedColumn')}</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">{t('common.inProgressColumn')}</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">{t('common.readyColumn')}</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">{t('common.futureColumn')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportRows.map((r, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{r.church}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{r.district}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{r.field}</td>
                          <td className="py-3 px-4 text-center font-medium text-gray-900 dark:text-white">{r.totalCandidates}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-green-600 dark:text-green-400 font-medium">{r.baptized}</span>
                          </td>
                          <td className="py-3 px-4 text-center text-amber-600 dark:text-amber-400 font-medium">{r.inProgress}</td>
                          <td className="py-3 px-4 text-center text-purple-600 dark:text-purple-400 font-medium">{r.readyForBaptism}</td>
                           <td className="py-3 px-4 text-center">{r.futureDated > 0 ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{t('common.futureBadge')}</span> : r.futureDated}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 dark:bg-slate-700/50 font-semibold">
                        <td colSpan={3} className="py-3 px-4 text-gray-700 dark:text-gray-300">{t('common.totalShort')}</td>
                        {(() => {
                          const totals = reportRows.reduce((s, r) => ({
                            totalCandidates: s.totalCandidates + r.totalCandidates,
                            baptized: s.baptized + r.baptized,
                            inProgress: s.inProgress + r.inProgress,
                            readyForBaptism: s.readyForBaptism + r.readyForBaptism,
                            futureDated: s.futureDated + r.futureDated,
                          }), { totalCandidates: 0, baptized: 0, inProgress: 0, readyForBaptism: 0, futureDated: 0 });
                          return (
                            <>
                              <td className="py-3 px-4 text-center text-gray-900 dark:text-white">{totals.totalCandidates}</td>
                              <td className="py-3 px-4 text-center text-green-600 dark:text-green-400">{totals.baptized}</td>
                              <td className="py-3 px-4 text-center text-amber-600 dark:text-amber-400">{totals.inProgress}</td>
                              <td className="py-3 px-4 text-center text-purple-600 dark:text-purple-400">{totals.readyForBaptism}</td>
                              <td className="py-3 px-4 text-center">{totals.futureDated > 0 ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{totals.futureDated}</span> : totals.futureDated}</td>
                            </>
                          );
                        })()}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
