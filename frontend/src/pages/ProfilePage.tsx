import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import { AlertCircle, Loader, User, Mail, Building, Briefcase, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => apiClient.getProfile(),
    select: (res) => res.data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">View and manage your account information</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">Failed to load profile. Please try again.</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile?.firstName} {profile?.lastName}</h2>
                  <p className="text-gray-600 mt-1">{profile?.designation}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="w-4 h-4" /> {profile?.branch}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-600 text-sm">Employee Code</p>
                <p className="text-2xl font-bold text-gray-900 font-mono">{profile?.employeeCode}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
                <div className="space-y-4">
                  <InfoField icon={<User className="w-5 h-5" />} label="Full Name" value={`${profile?.firstName} ${profile?.lastName}`} />
                  <InfoField icon={<Mail className="w-5 h-5" />} label="Email Address" value={profile?.email} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Work Information</h3>
                <div className="space-y-4">
                  <InfoField icon={<Briefcase className="w-5 h-5" />} label="Designation" value={profile?.designation} />
                  <InfoField icon={<Building className="w-5 h-5" />} label="Branch" value={profile?.branch} />
                  <InfoField icon={<Briefcase className="w-5 h-5" />} label="Role" value={profile?.role} />
                </div>
              </div>
            </div>

            {profile?.lastLoginAt && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Activity</h3>
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-5 h-5" />
                  <span>Last Login: <span className="font-medium text-gray-900">{new Date(profile.lastLoginAt).toLocaleString()}</span></span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-gray-900 font-medium mt-1">{value || '-'}</p>
      </div>
    </div>
  );
}
