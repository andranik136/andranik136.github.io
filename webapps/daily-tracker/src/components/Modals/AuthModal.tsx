import React from 'react';
import { UserProfile, SyncStatus } from '../../types';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  googleProvider,
  signOut,
  RECAPTCHA_SITE_KEY
} from '../../firebase';
import { 
  User as UserIcon, 
  LogIn, 
  UserPlus, 
  LogOut, 
  X, 
  Cloud, 
  Loader2,
  Check,
  ShieldCheck, 
  Mail, 
  Lock,
  AlertCircle
} from 'lucide-react';
import clsx from 'clsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  syncStatus: SyncStatus;
  theme?: 'dark' | 'light';
  taskCount?: number;
  noteCount?: number;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  syncStatus,
  theme,
  taskCount = 0,
  noteCount = 0,
}) => {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const isLight = theme === 'light';

  const [tab, setTab] = React.useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      // Execute invisible score-based reCAPTCHA Enterprise token generation
      if (typeof window !== 'undefined' && (window as any).grecaptcha?.enterprise) {
        try {
          await (window as any).grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, {
            action: tab === 'signin' ? 'LOGIN' : 'REGISTER'
          });
        } catch (recaptchaErr) {
          console.warn('reCAPTCHA Enterprise execution note:', recaptchaErr);
        }
      }

      if (tab === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setEmail('');
      setPassword('');
      onClose();
    } catch (err: any) {
      console.error('Auth Error:', err);
      let msg = 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters long.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address format.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Email/Password authentication is disabled in Firebase Console (Authentication > Sign-in method).';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setErrorMsg('Google Sign-In was cancelled or unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className={clsx(
        "p-0 rounded-xl border w-full max-w-md shadow-2xl overflow-hidden transition-colors",
        isLight 
          ? "bg-white border-blue-200 text-slate-900 backdrop:bg-slate-900/40" 
          : "bg-slate-900 border-purple-900/50 text-slate-100 backdrop:bg-slate-950/80"
      )}
    >
      {/* Header */}
      <div className={clsx("p-4 border-b flex items-center justify-between", isLight ? "bg-blue-50/60 border-blue-200" : "bg-slate-950/60 border-purple-900/40")}>
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className={clsx("text-sm font-bold", isLight ? "text-slate-900" : "text-slate-100")}>
              {user ? 'Account & Cloud Sync' : 'Sign In / Register'}
            </h2>
            <p className={clsx("text-[11px]", isLight ? "text-slate-500" : "text-slate-400")}>
              {user ? 'Sync your data across all your devices' : 'Backup and sync your tasks & daily notes'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className={clsx("p-1.5 rounded-lg transition-colors", isLight ? "hover:bg-blue-100 text-slate-500 hover:text-slate-800" : "hover:bg-slate-800 text-slate-400 hover:text-white")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-5 space-y-4">
        {user ? (
          /* Authenticated User View */
          <div className="space-y-4">
            <div className={clsx("p-4 rounded-xl border flex items-center space-x-3", isLight ? "bg-blue-50/40 border-blue-200" : "bg-slate-950/60 border-purple-900/40")}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="User Avatar" className="w-11 h-11 rounded-full border shadow-sm" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className={clsx("text-xs font-bold truncate", isLight ? "text-slate-900" : "text-slate-100")}>
                  {user.displayName || user.email || 'Daily Tracker User'}
                </h3>
                <p className={clsx("text-[11px] truncate", isLight ? "text-slate-500" : "text-slate-400")}>
                  {user.email}
                </p>
                
                {/* Sync Badge */}
                <div className="flex items-center space-x-1 mt-1 text-[10px] font-semibold">
                  {syncStatus === 'synced' && (
                    <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
                      <Cloud className="w-3.5 h-3.5" />
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Cloud Synced</span>
                    </span>
                  )}
                  {syncStatus === 'syncing' && (
                    <span className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Syncing...</span>
                    </span>
                  )}
                  {syncStatus === 'error' && (
                    <span className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Sync Blocked (Check Firestore Rules / Ad-Blocker)</span>
                    </span>
                  )}
                  {syncStatus === 'idle' && (
                    <span className="flex items-center space-x-1 text-slate-500">
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Connected</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Cloud Stats */}
            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div className={clsx("p-3 rounded-xl border space-y-0.5", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-800")}>
                <span className="text-lg font-black text-blue-600">{taskCount}</span>
                <p className={clsx("text-[10px] font-medium", isLight ? "text-slate-500" : "text-slate-400")}>Tasks Synced</p>
              </div>
              <div className={clsx("p-3 rounded-xl border space-y-0.5", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-800")}>
                <span className="text-lg font-black text-purple-600">{noteCount}</span>
                <p className={clsx("text-[10px] font-medium", isLight ? "text-slate-500" : "text-slate-400")}>Notes Synced</p>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleSignOut}
              className={clsx(
                "w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95",
                isLight ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200" : "bg-red-950/30 hover:bg-red-900/40 text-red-400 border-red-900/40"
              )}
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Account</span>
            </button>
          </div>
        ) : (
          /* Sign In / Sign Up View */
          <div className="space-y-4">
            {/* Sync Alert Banner */}
            <div className={clsx("p-3 rounded-xl border flex items-start space-x-2 text-[11px]", isLight ? "bg-blue-50/80 border-blue-200 text-blue-800" : "bg-purple-950/40 border-purple-800/40 text-purple-200")}>
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600 dark:text-purple-400" />
              <p>
                Sign in to automatically sync your tasks, notes, and settings across all your devices. Your current local data will be safely merged into your account.
              </p>
            </div>

            {/* Tab Switcher */}
            <div className={clsx("flex p-1 rounded-xl border text-xs", isLight ? "bg-slate-100 border-slate-200" : "bg-slate-950 border-slate-800")}>
              <button
                type="button"
                onClick={() => setTab('signin')}
                className={clsx(
                  "flex-1 py-1.5 rounded-lg font-semibold transition-all text-center",
                  tab === 'signin' 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm" 
                    : isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-slate-200"
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setTab('signup')}
                className={clsx(
                  "flex-1 py-1.5 rounded-lg font-semibold transition-all text-center",
                  tab === 'signup' 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm" 
                    : isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-slate-200"
                )}
              >
                Register
              </button>
            </div>

            {/* Error Feedback */}
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="space-y-1">
                <label className={clsx("text-[11px] font-semibold block", isLight ? "text-slate-700" : "text-slate-300")}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={clsx("w-4 h-4 absolute left-3 top-2.5", isLight ? "text-slate-400" : "text-slate-500")} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={clsx(
                      "w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all",
                      isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950 border-slate-800 text-slate-100"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={clsx("text-[11px] font-semibold block", isLight ? "text-slate-700" : "text-slate-300")}>
                  Password
                </label>
                <div className="relative">
                  <Lock className={clsx("w-4 h-4 absolute left-3 top-2.5", isLight ? "text-slate-400" : "text-slate-500")} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={clsx(
                      "w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all",
                      isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950 border-slate-800 text-slate-100"
                    )}
                  />
                </div>
              </div>

              {/* Invisible reCAPTCHA Enterprise Protection Badge */}
              <div className="flex flex-col items-center justify-center py-1">
                <span className={clsx("text-[11px] flex items-center space-x-1 font-medium px-3 py-1 rounded-full border", isLight ? "bg-blue-50/60 border-blue-200 text-blue-800" : "bg-slate-950/60 border-purple-900/40 text-purple-300")}>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Protected by Google reCAPTCHA Enterprise</span>
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {tab === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{loading ? 'Processing...' : tab === 'signin' ? 'Sign In' : 'Create Account'}</span>
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className={clsx("border-t w-full", isLight ? "border-slate-200" : "border-slate-800")} />
              <span className={clsx("px-2 text-[10px] uppercase font-bold absolute", isLight ? "bg-white text-slate-400" : "bg-slate-900 text-slate-500")}>
                or
              </span>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className={clsx(
                "w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95",
                isLight ? "bg-white hover:bg-slate-50 text-slate-800 border-slate-200" : "bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-800"
              )}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
};
