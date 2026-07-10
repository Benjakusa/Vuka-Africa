import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

export default function AuthPage() {
  const [panel, setPanel] = useState<'login' | 'register'>('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    phone: '+254',
    password: '',
    role: 'TRAINEE',
  });
  const [showRegPw, setShowRegPw] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, setUser, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (searchParams.get('panel') === 'register') setPanel('register');
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/trainee';
      if (redirect === '/trainee' || redirect === '/') {
        const role = user?.role;
        if (role === 'ADMIN') navigate('/admin', { replace: true });
        else if (role === 'TRAINER') navigate('/trainer', { replace: true });
        else navigate(redirect, { replace: true });
      } else {
        navigate(redirect, { replace: true });
      }
    }
  }, [isAuthenticated, navigate, searchParams, user]);

  const isRegister = panel === 'register';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const user = await login(loginEmail, loginPassword);
      setUser(user);
      toast.success('Welcome back!');
      const role = user?.role;
      const redirect =
        searchParams.get('redirect') || (role === 'ADMIN' ? '/admin' : role === 'TRAINER' ? '/trainer' : '/trainee');
      navigate(redirect, { replace: true });
    } catch (err: any) {
      setLoginError(
        err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err)) || 'Invalid email or password',
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setRegForm({ ...regForm, [e.target.name]: e.target.value });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);
    try {
      await register(regForm);
      toast.success('Account created! Please sign in.');
      navigate('/auth/login', { replace: true });
    } catch (err: any) {
      setRegError(err.message || 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .ap-root { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #FAFAFA; padding: 1rem; font-family: 'Inter', system-ui, sans-serif; }
        .ap-card { position: relative; width: 100%; max-width: 860px; height: 600px; border-radius: 1.5rem; box-shadow: 0 24px 64px -12px rgba(255,63,52,.18), 0 8px 24px -4px rgba(0,0,0,.10); overflow: hidden; background: #fff; }
        .ap-panel { position: absolute; top: 0; width: 50%; height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 2.5rem 2.25rem; background: #fff; z-index: 1; }
        .ap-panel--login  { left: 0; }
        .ap-panel--register { right: 0; }
        .ap-overlay { position: absolute; top: 0; left: 50%; width: 50%; height: 100%; background: #ff3f34; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 2rem; text-align: center; z-index: 5; transition: transform .65s cubic-bezier(.77,0,.175,1); }
          .ap-overlay__logo { margin-bottom: .4rem; display: flex; align-items: center; justify-content: center; }
        .ap-overlay__tagline { font-size: .875rem; color: rgba(255,255,255,.88); line-height: 1.65; margin-bottom: 1.75rem; white-space: pre-line; }
        .ap-overlay__btn { padding: .6rem 2rem; border: 2px solid rgba(255,255,255,.75); border-radius: .5rem; color: #fff; font-weight: 700; font-size: .875rem; background: transparent; cursor: pointer; transition: background .2s; }
        .ap-overlay__btn:hover { background: rgba(255,255,255,.15); }
        .ap-panel h1 { font-size: 1.6rem; font-weight: 800; color: #1A1A1A; margin: 0 0 .2rem; }
        .ap-sub { font-size: .875rem; color: #4B5563; margin: 0 0 1.4rem; }
        .ap-back { display: inline-flex; align-items: center; gap: .3rem; font-size: .78rem; color: #ff3f34; text-decoration: none; font-weight: 500; margin-bottom: 1rem; }
        .ap-back:hover { text-decoration: underline; }
        .ap-field { margin-bottom: .8rem; }
        .ap-label { display: block; font-size: .78rem; font-weight: 600; color: #1A1A1A; margin-bottom: .3rem; }
        .ap-input { width: 100%; padding: .58rem .85rem; border: 1.5px solid #E5E7EB; border-radius: .5rem; font-size: .875rem; color: #1A1A1A; background: #FAFAFA; outline: none; transition: border-color .18s, box-shadow .18s, background .18s; font-family: inherit; }
        .ap-input:focus { border-color: #ff3f34; box-shadow: 0 0 0 3px rgba(255,63,52,.15); background: #fff; }
        .ap-input-wrap { position: relative; }
        .ap-input-wrap .ap-input { padding-right: 2.4rem; }
        .ap-eye { position: absolute; right: .7rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #9AA3AF; display: flex; align-items: center; padding: 0; line-height: 1; }
        .ap-eye:hover { color: #ff3f34; }
        .ap-forgot { text-align: right; margin-top: .2rem; }
        .ap-forgot a { font-size: .75rem; color: #ff3f34; text-decoration: none; font-weight: 600; }
        .ap-forgot a:hover { text-decoration: underline; }
        .ap-error { font-size: .8rem; color: #EF4444; background: #FEF2F2; border-radius: .4rem; padding: .45rem .75rem; margin-bottom: .5rem; }
        .ap-submit { width: 100%; padding: .72rem; background: #ff3f34; color: #fff; font-weight: 700; font-size: .9rem; border: none; border-radius: .5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: .5rem; margin-top: .4rem; transition: background .2s, transform .15s; font-family: inherit; }
        .ap-submit:hover:not(:disabled) { background: #e03029; transform: translateY(-1px); }
        .ap-submit:active:not(:disabled) { transform: translateY(0); }
        .ap-submit:disabled { opacity: .55; cursor: not-allowed; }
        @keyframes ap-spin { to { transform: rotate(360deg); } }
        .ap-spin { animation: ap-spin .7s linear infinite; }
        .ap-mobile-header { display: none; }
        .ap-mobile-toggle { display: none; }
        @media (max-width: 640px) {
          /* Page background */
          .ap-root {
            padding: 1.25rem;
            background: #F1F1F1;
            justify-content: center;
            align-items: center;
            min-height: 100dvh;
          }
          /* The card: floating, rounded, elevated, never touches screen edges */
          .ap-card {
            height: auto;
            width: 100%;
            max-width: 420px;
            border-radius: 1.25rem;
            overflow: hidden;
            box-shadow: 0 20px 60px -10px rgba(0,0,0,.18), 0 6px 20px -4px rgba(0,0,0,.10);
            background: #fff;
            display: flex;
            flex-direction: column;
          }
          /* Hide desktop overlay panel */
          .ap-overlay { display: none; }
          /* Panels become full-width blocks inside the card */
          .ap-panel {
            position: relative;
            width: 100%;
            height: auto;
            padding: 0;
            background: #fff;
          }
          .ap-panel--login, .ap-panel--register { left: auto; right: auto; display: none; }
          .ap-panel--login.ap-active, .ap-panel--register.ap-active { display: flex; flex-direction: column; }
          /* Hide desktop back link */
          .ap-back { display: none; }
          /* Mobile header: full-width brand strip at top of card, flush with all edges */
          .ap-mobile-header {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #ff3f34;
            padding: 2rem 1.5rem 1.75rem;
            text-align: center;
            position: relative;
            width: 100%;
            /* Ensure zero gap from card edges */
            margin: 0;
            flex-shrink: 0;
            border-radius: 0;
          }
          .ap-mobile-header__logo {
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
          }
          .ap-mobile-header__sub {
            font-size: .8rem;
            color: rgba(255,255,255,.88);
            margin-top: .4rem;
            font-weight: 500;
            letter-spacing: .01em;
          }
          /* Back link in header */
          .ap-mobile-header .ap-mobile-back {
            position: absolute;
            left: 1rem;
            top: 1rem;
            color: rgba(255,255,255,.75);
            font-size: .78rem;
            text-decoration: none;
            font-weight: 500;
          }
          .ap-mobile-header .ap-mobile-back:hover { color: #fff; }
          /* Hide the form-panel h1 and subtitle on mobile — card header handles this */
          .ap-mobile-card h1, .ap-mobile-card .ap-sub { display: none; }
          /* Form area inside card */
          .ap-mobile-card {
            background: #fff;
            padding: 1.75rem 1.5rem 2rem;
            flex: 1;
            display: flex;
            flex-direction: column;
          }
          /* Center form headings */
          .ap-panel h1 { text-align: center; margin-top: 0; font-size: 1.4rem; }
          .ap-sub { text-align: center; margin-bottom: 1.25rem; }
          /* Switch panel toggle */
          .ap-mobile-toggle {
            display: flex !important;
            justify-content: center;
            align-items: center;
            gap: .35rem;
            margin-top: 1.25rem;
            font-size: .82rem;
            color: #6B7280;
          }
          .ap-mobile-toggle button {
            background: none;
            border: none;
            color: #ff3f34;
            font-weight: 700;
            font-size: .82rem;
            cursor: pointer;
            padding: 0;
            font-family: inherit;
          }
          .ap-mobile-toggle button:hover { text-decoration: underline; }
        }
      `}</style>

      <div className="ap-root">
        <div className="ap-card">
          <div className="ap-mobile-header">
            <Link to="/" className="ap-mobile-back">
              ← Back
            </Link>
            <div className="ap-mobile-header__logo">
              <img src="/brand/VUKA AFRICA LOGO ORANGE BACKGROUND.png" alt="" className="h-11" />
            </div>
            <div className="ap-mobile-header__sub">{isRegister ? 'Create your account' : 'Sign into your account'}</div>
          </div>
          <div className={`ap-panel ap-panel--login${!isRegister ? ' ap-active' : ''}`}>
            <div className="ap-mobile-card">
              <Link to="/" className="ap-back">
                ← Home
              </Link>
              <h1>Welcome back</h1>
              <p className="ap-sub">Sign in to your account</p>

              <form onSubmit={handleLogin}>
                <div className="ap-field">
                  <label className="ap-label" htmlFor="login-email">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    className="ap-input"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="ap-field">
                  <label className="ap-label" htmlFor="login-password">
                    Password
                  </label>
                  <div className="ap-input-wrap">
                    <input
                      id="login-password"
                      type={showLoginPw ? 'text' : 'password'}
                      className="ap-input"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="ap-eye"
                      onClick={() => setShowLoginPw(!showLoginPw)}
                      aria-label={showLoginPw ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <div className="ap-forgot">
                    <Link to="/auth/forgot-password">Forgot password?</Link>
                  </div>
                </div>
                {loginError && <p className="ap-error">{loginError}</p>}
                <button id="login-submit" type="submit" className="ap-submit" disabled={loginLoading}>
                  {loginLoading && <Loader2 size={15} className="ap-spin" />}
                  Sign In
                </button>
              </form>

              <div className="ap-mobile-toggle">
                Don&apos;t have an account? <button onClick={() => setPanel('register')}>Sign Up</button>
              </div>
            </div>
          </div>

          <div className={`ap-panel ap-panel--register${isRegister ? ' ap-active' : ''}`}>
            <div className="ap-mobile-card">
              <Link to="/" className="ap-back">
                ← Home
              </Link>
              <h1>Create Account</h1>
              <p className="ap-sub">Create your account and start learning today</p>

              <form onSubmit={handleRegister}>
                <div className="ap-field">
                  <label className="ap-label" htmlFor="reg-fullname">
                    Full Name
                  </label>
                  <input
                    id="reg-fullname"
                    name="fullName"
                    type="text"
                    className="ap-input"
                    placeholder="John Doe"
                    value={regForm.fullName}
                    onChange={handleRegChange}
                    required
                  />
                </div>
                <div className="ap-field">
                  <label className="ap-label" htmlFor="reg-email">
                    Email
                  </label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    className="ap-input"
                    placeholder="you@example.com"
                    value={regForm.email}
                    onChange={handleRegChange}
                    required
                  />
                </div>
                <div className="ap-field">
                  <label className="ap-label" htmlFor="reg-phone">
                    Phone
                  </label>
                  <input
                    id="reg-phone"
                    name="phone"
                    type="tel"
                    className="ap-input"
                    placeholder="+254 712 345 678"
                    value={regForm.phone}
                    onChange={handleRegChange}
                    required
                  />
                </div>
                <div className="ap-field">
                  <label className="ap-label" htmlFor="reg-password">
                    Password
                  </label>
                  <div className="ap-input-wrap">
                    <input
                      id="reg-password"
                      name="password"
                      type={showRegPw ? 'text' : 'password'}
                      className="ap-input"
                      placeholder="At least 8 characters"
                      value={regForm.password}
                      onChange={handleRegChange}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="ap-eye"
                      onClick={() => setShowRegPw(!showRegPw)}
                      aria-label={showRegPw ? 'Hide password' : 'Show password'}
                    >
                      {showRegPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="ap-field">
                  <label className="ap-label" htmlFor="reg-role">
                    I want to
                  </label>
                  <select
                    id="reg-role"
                    name="role"
                    className="ap-input"
                    style={{ cursor: 'pointer' }}
                    value={regForm.role}
                    onChange={handleRegChange}
                  >
                    <option value="TRAINEE">Learn (Trainee)</option>
                    <option value="TRAINER">Teach (Trainer)</option>
                  </select>
                </div>
                {regError && <p className="ap-error">{regError}</p>}
                <button id="reg-submit" type="submit" className="ap-submit" disabled={regLoading}>
                  {regLoading && <Loader2 size={15} className="ap-spin" />}
                  Create Account
                </button>
              </form>

              <div className="ap-mobile-toggle">
                Already have an account? <button onClick={() => setPanel('login')}>Sign In</button>
              </div>
            </div>
          </div>

          <div className="ap-overlay" style={{ transform: isRegister ? 'translateX(-100%)' : 'translateX(0)' }}>
            <div className="ap-overlay__logo">
              <img src="/brand/VUKA AFRICA LOGO ORANGE BACKGROUND.png" alt="" className="h-14" />
            </div>
            <p className="ap-overlay__tagline">
              {isRegister
                ? 'Already have an account?\nSign in and continue your journey.'
                : "Join thousands mastering\nAfrica's best skills."}
            </p>
            <button className="ap-overlay__btn" onClick={() => setPanel(isRegister ? 'login' : 'register')}>
              {isRegister ? 'Sign In →' : 'Sign Up →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
