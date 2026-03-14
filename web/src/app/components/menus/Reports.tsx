import { useState, useMemo, useCallback } from 'react';
import { Download, Calendar, Activity, Globe } from 'lucide-react';
import { Card } from '../common/ui/card';
import { Button } from '../common/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../common/ui/select';
import { User as UserType } from '@/app/types';
import { toast } from 'sonner';
import { useGetReportSummaryQuery, useGetReportRegionalQuery } from '@/app/store/apis/reportsApi';
import type { ReportSummary, ReportRegionalRow } from '@/app/store/apis/reportsApi';
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import * as XLSX from 'xlsx';

interface ReportsProps {
  currentUser: UserType;
}

type ReportType = 'summary' | 'performance' | 'sla' | 'regional';
type DateRange = 'week' | 'month' | 'year' | 'all';

const STATUS_COLORS: Record<string, string> = {
  Open: '#f59e0b',
  'In Progress': '#3b82f6',
  'On-hold': '#8b5cf6',
  Resolved: '#10b981',
  Closed: '#6b7280',
};

export function Reports({ currentUser }: ReportsProps) {
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [dateRange, setDateRange] = useState<DateRange>('month');

  const queryParams = { dateRange: dateRange as 'week' | 'month' | 'year' | 'all' };
  const { data: summary, isLoading: summaryLoading } = useGetReportSummaryQuery(queryParams);
  const { data: regional = [], isLoading: regionalLoading } = useGetReportRegionalQuery(queryParams);

  const stats: ReportSummary = useMemo(
    () =>
      summary ?? {
        total: 0,
        resolved: 0,
        open: 0,
        inProgress: 0,
        onHold: 0,
        closed: 0,
        escalated: 0,
      },
    [summary]
  );

  const zoneChartData = useMemo(
    () =>
      regional.map((r: ReportRegionalRow) => ({
        name: r.zoneName,
        tickets: r.total,
        resolved: r.resolved,
      })),
    [regional]
  );

  const statusChartData = useMemo(() => {
    const data = [
      { name: 'Open', value: stats.open },
      { name: 'In Progress', value: stats.inProgress ?? 0 },
      { name: 'On-hold', value: stats.onHold ?? 0 },
      { name: 'Resolved', value: stats.resolved },
      { name: 'Closed', value: stats.closed ?? 0 },
    ].filter((d) => d.value > 0);
    return data;
  }, [stats]);

  const handleExport = useCallback(() => {
    try {
      const summarySheet = XLSX.utils.json_to_sheet([
        { Metric: 'Total volume', Value: stats.total },
        { Metric: 'Resolved', Value: stats.resolved },
        { Metric: 'Active Open', Value: stats.open },
        { Metric: 'In Progress', Value: stats.inProgress ?? 0 },
        { Metric: 'On-hold', Value: stats.onHold ?? 0 },
        { Metric: 'Closed', Value: stats.closed ?? 0 },
        { Metric: 'Escalations', Value: stats.escalated },
      ]);
      const regionalSheet = XLSX.utils.json_to_sheet(
        regional.map((r) => ({ Zone: r.zoneName, Total: r.total, Resolved: r.resolved, Open: r.open }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      XLSX.utils.book_append_sheet(wb, regionalSheet, 'Regional');
      const fileName = `analytics-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Report exported as ' + fileName);
    } catch (err) {
      toast.error('Failed to export report');
    }
  }, [stats, regional]);

  const isLoading = summaryLoading || regionalLoading;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={reportType} onValueChange={(v: ReportType) => setReportType(v)}>
            <SelectTrigger className="w-[200px] h-10 font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Operational Summary</SelectItem>
              <SelectItem value="regional">Regional Breakdown</SelectItem>
              <SelectItem value="sla">SLA Compliance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={(v: DateRange) => setDateRange(v)}>
            <SelectTrigger className="w-[140px] h-10 border-slate-200">
              <Calendar className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isLoading}
          className="h-10 gap-2 font-bold"
        >
          <Download className="w-4 h-4" /> Export Analytics
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">Loading report data…</div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-6">
              <Card className="p-6 border-blue-100 bg-white">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total volume</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </Card>
              <Card className="p-6 border-green-100 bg-white">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Resolved</p>
                <p className="text-3xl font-bold text-slate-900">{stats.resolved}</p>
              </Card>
              <Card className="p-6 border-amber-100 bg-white">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Open</p>
                <p className="text-3xl font-bold text-slate-900">{stats.open}</p>
              </Card>
              <Card className="p-6 border-red-100 bg-white">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Escalations</p>
                <p className="text-3xl font-bold text-slate-900">{stats.escalated}</p>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-sm uppercase">
                  <Globe className="w-4 h-4 text-blue-500" /> Regional Performance
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={zoneChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip formatter={(value: number) => [value, '']} />
                    <Legend />
                    <Bar dataKey="tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Tickets" />
                    <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved" />
                  </BarChart>
                </ResponsiveContainer>
                {zoneChartData.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">No regional data for this period.</p>
                )}
              </Card>
              <Card className="p-6">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-sm uppercase">
                  <Activity className="w-4 h-4 text-purple-500" /> Status Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  {statusChartData.length > 0 ? (
                    <RechartsPieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [value, name]} />
                      <Legend />
                    </RechartsPieChart>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-16">No tickets in this period.</p>
                  )}
                </ResponsiveContainer>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
