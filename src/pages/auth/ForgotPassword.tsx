import { useState } from 'react';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { forgotPassword } from '@/services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-8">
          <ArrowLeft size={16} /> Back to Login
        </Link>

        {sent ? (
          <div className="text-center">
            <CheckCircle size={48} className="text-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold text-dark mb-2">Check your email</h1>
            <p className="text-sm text-body">
              If an account with that email exists, we&apos;ve sent a password reset link.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-dark">Forgot password?</h1>
              <p className="text-sm text-body mt-1">Enter your email and we&apos;ll send you a reset link.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-dark mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-surface disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Send Reset Link
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
