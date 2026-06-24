// src/pages/DashboardPage.tsx
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import { useAuthStore } from '../store/authStore';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Users,
  Phone,
  Target,
  AlertCircle,
  Loader,
  Download
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiClient.getDashboardSummary(),
    select: (res) => res.data
  });

  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: () => apiClient.getAnalytics(),
    select: (res) => res.data
  });

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const response = await apiClient.exportData(format);
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `staff_records.${format === 'csv' ? 'csv' : 'xlsx'}`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.firstName} {user?.lastName}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {summaryLoading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : summaryError ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">Failed to load dashboard data</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            icon={<Users className="w-6 h-6" />}
            title="Total Records"
            value={summary?.totalRecords || 0}
            color="blue"
          />
          <KPICard
            icon={<Target className="w-6 h-6" />}
            title="Last 30 Days"
            value={summary?.last30Days || 0}
            color="green"
          />
          <KPICard
            icon={<Phone className="w-6 h-6" />}
            title="Calls"
            value={summary?.calls || 0}
            color="orange"
          />
          <KPICard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Visits"
            value={summary?.visits || 0}
            color="purple"
          />
          <KPICard
            icon={<Users className="w-6 h-6" />}
            title="New Leads"
            value={summary?.newLeads || 0}
            color="pink"
          />
        </div>
      )}

      {/* Charts */}
      {analyticsLoading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : analyticsError ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">Failed to load analytics data</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.activityBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Customer Type */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Type Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.customerTypeBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics?.customerTypeBreakdown?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Lead Source Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Source Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.leadSourceBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="activities" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatBox label="Warm Prospects" value={summary.warmProspects} />
            <StatBox label="Hot Prospects" value={summary.hotProspects} />
            <StatBox label="Conversion Rate" value={`${summary.totalRecords > 0 ? Math.round((summary.newLeads / summary.totalRecords) * 100) : 0}%`} />
          </div>
        </div>
      )}
    </div>
  );
}

interface KPICardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'pink';
}

function KPICard({ icon, title, value, color }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    pink: 'bg-pink-100 text-pink-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: string | number;
}

function StatBox({ label, value }: StatBoxProps) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-gray-600 text-sm font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
