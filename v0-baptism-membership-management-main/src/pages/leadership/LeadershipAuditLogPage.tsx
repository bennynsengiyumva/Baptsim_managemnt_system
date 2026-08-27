import { useQuery } from '@tanstack/react-query';
import {
  History, User, Building2, Landmark, Calendar,
  AlertCircle, Filter
} from 'lucide-react';
import { leadershipAuditLogService, LeadershipAuditLog } from '@/services/leadershipAuditLogService';
import Card from '@/components/ui/Card';
import { useState } from 'react';

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  HEAD_OF_DISTRICT_TRANSFERRED: { label: 'District Transferred', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  HEAD_OF_DISTRICT_REASSIGNED: { label: 'District Reassigned', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  HEAD_OF_FIELD_REPLACED: { label: 'Field Replaced', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  HEAD_OF_FIELD_APPOINTED: { label: 'Field Appointed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
};

export default function LeadershipAuditLogPage() {
  const [filterType, setFilterType] = useState<string>('ALL');

  const { data: allLogs = [], isLoading } = useQuery({
    queryKey: ['leadership-audit-logs'],
    queryFn: leadershipAuditLogService.getAll,
  });

  const filteredLogs = filterType === 'ALL'
    ? allLogs
    : allLogs.filter((log: LeadershipAuditLog) => log.eventType === filterType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leadership Audit Log</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Complete history of all leadership changes</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Filter className="w-5 h-5 text-slate-400" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        >
          <option value="ALL">All Events</option>
          <option value="HEAD_OF_DISTRICT_TRANSFERRED">District Transferred</option>
          <option value="HEAD_OF_DISTRICT_REASSIGNED">District Reassigned</option>
          <option value="HEAD_OF_FIELD_REPLACED">Field Replaced</option>
          <option value="HEAD_OF_FIELD_APPOINTED">Field Appointed</option>
        </select>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {filteredLogs.length} event{filteredLogs.length !== 1 ? 's' : ''}
        </span>
      </div>

      <Card icon={<History className="w-5 h-5" />}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-600 dark:text-slate-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Leader
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Previous Assignment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    New Assignment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Performed By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {filteredLogs.map((log: LeadershipAuditLog) => {
                  const eventTypeInfo = EVENT_TYPE_LABELS[log.eventType] || { label: log.eventType, color: 'bg-slate-100 text-slate-800' };
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${eventTypeInfo.color}`}>
                          {eventTypeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-5 h-5 text-slate-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {log.leaderName}
                            </div>
                            {log.districtName && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {log.districtName}
                              </div>
                            )}
                            {log.fieldName && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Landmark className="w-3 h-3" />
                                {log.fieldName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-slate-900 dark:text-white max-w-xs truncate">
                          {log.previousAssignmentSummary || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-slate-900 dark:text-white max-w-xs truncate">
                          {log.newAssignmentSummary || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        {log.performedBy || '—'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-slate-900 dark:text-white">
                          <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                          {new Date(log.eventDate).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
