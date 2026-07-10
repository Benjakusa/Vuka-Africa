import { useState, Suspense } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { resetPassword } from '@/services/authService';

function ResetForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid reset link');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/auth/login'), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-primary mb-4">Invalid or missing reset token.</p>
        <Link to="/auth/forgot-password" className="text-primary hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle size={48} className="text-foreground mx-auto mb-4" />
        <h1 className="text-xl font-bold text-dark mb-2">Password reset!</h1>
        <p className="text-sm text-body mb-4">Redirecting you to login...</p>
        <Link to="/auth/login" className="text-primary hover:underline">
          Login now
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-dark">Set new password</h1>
        <p className="text-sm text-body mt-1">Must be at least 8 characters with a letter and number.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-dark mb-1 block">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm pr-10"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-body-foreground"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || password.length < 8}
          className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-surface disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Reset Password
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Suspense
          fallback={
            <div className="text-center">
              <Loader2 size={24} className="animate-spin mx-auto" />
            </div>
          }
        >
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
