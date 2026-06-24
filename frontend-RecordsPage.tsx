// src/pages/RecordsPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import { AlertCircle, Loader, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface Record {
  id: string;
  date: string;
  activityType: string;
  prospectName: string;
  phoneNumber: string;
  productInterested: string;
  profileOfCustomer: string;
  nextFollowUpDate?: string;
}

export default function RecordsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const { data, isLoading, error } = useQuery({
    queryKey: ['staff-records', page, limit],
    queryFn: () => apiClient.getRecords(page, limit),
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Warm':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hot':
        return 'bg-red-100 text-red-800';
      case 'Cold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'Visit':
        return 'bg-purple-100 text-purple-800';
      case 'Calls':
        return 'bg-green-100 text-green-800';
      case 'New Lead':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Records</h1>
          <p className="text-gray-600 mt-1">View and manage your performance records</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">Failed to load records. Please try again.</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Activity</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Prospect Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Follow-up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.records && data.records.length > 0 ? (
                    data.records.map((record: Record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActivityColor(record.activityType)}`}>
                            {record.activityType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.prospectName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                          {record.phoneNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {record.productInterested}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.profileOfCustomer)}`}>
                            {record.profileOfCustomer}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {record.nextFollowUpDate ? new Date(record.nextFollowUpDate).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
              <div className="text-sm text-gray-600">
                Page <span className="font-semibold">{data.pagination.page}</span> of <span className="font-semibold">{data.pagination.pages}</span>
                {' '}({data.pagination.total} total records)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                  disabled={page === data.pagination.pages}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
