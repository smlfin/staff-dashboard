import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, Loader, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'employee-code' | 'password'>('employee-code');
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employeeData, setEmployeeData] = useState<any>(null);

  // Step 1: Verify Employee Code
  const handleVerifyEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/auth/verify-employee/${employeeCode}`);
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Employee code not found');
        return;
      }

      const data = await response.json();
      setEmployeeData(data);
      setStep('password'); // Move to password step
    } catch (err: any) {
      setError('Failed to verify employee code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Create Password and Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeCode,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Registration failed');
        return;
      }

      // Success!
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">
            {step === 'employee-code' ? 'Enter your Employee Code' : 'Set your password'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* STEP 1: Verify Employee Code */}
        {step === 'employee-code' && (
          <form onSubmit={handleVerifyEmployee} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Code
              </label>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                placeholder="e.g., 1055"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Your employee code from the staff directory
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !employeeCode}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Employee Code'
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Set Password (after successful verification) */}
        {step === 'password' && employeeData && (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Display Employee Info */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">✅ Employee Verified</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{employeeData.employeeName}</p>
              <div className="text-sm text-gray-600 mt-2 space-y-1">
                <p>📍 Branch: {employeeData.branch}</p>
                <p>💼 Designation: {employeeData.designation}</p>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Create Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Min 8 characters recommended
              </p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password || password !== confirmPassword}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => {
                setStep('employee-code');
                setPassword('');
                setConfirmPassword('');
                setError('');
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}