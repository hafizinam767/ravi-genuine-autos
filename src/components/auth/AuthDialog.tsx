'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { Loader2, Mail, Lock, User, Phone, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface ForgotPasswordForm {
  email: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
}

interface RegisterErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

type DialogMode = 'login' | 'register' | 'forgot-password';

export default function AuthDialog() {
  const showAuth = useAppStore((s) => s.showAuth);
  const authMode = useAppStore((s) => s.authMode);
  const setShowAuth = useAppStore((s) => s.setShowAuth);
  const setUser = useAppStore((s) => s.setUser);

  const [mode, setMode] = useState<DialogMode>(authMode);
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [forgotPasswordForm, setForgotPasswordForm] = useState<ForgotPasswordForm>({
    email: '',
  });
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});

  // Sync mode from store
  const effectiveMode: DialogMode = authMode || (mode === 'forgot-password' ? 'forgot-password' : mode);

  const switchMode = (newMode: DialogMode) => {
    setMode(newMode);
    if (newMode === 'login' || newMode === 'register') {
      setShowAuth(true, newMode);
    }
    setLoginErrors({});
    setRegisterErrors({});
    setForgotPasswordSent(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setShowAuth(false);
      setLoginErrors({});
      setRegisterErrors({});
      setForgotPasswordSent(false);
      // Reset mode to login for next open
      setMode('login');
    }
  };

  const validateLogin = (): boolean => {
    const errors: LoginErrors = {};
    if (!loginForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email)) {
      errors.email = 'Enter a valid email address';
    }
    if (!loginForm.password) {
      errors.password = 'Password is required';
    } else if (loginForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegister = (): boolean => {
    const errors: RegisterErrors = {};
    if (!registerForm.name.trim()) errors.name = 'Name is required';
    if (!registerForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
      errors.email = 'Enter a valid email address';
    }
    if (registerForm.phone && !/^[\d+\-\s()]{7,15}$/.test(registerForm.phone.trim())) {
      errors.phone = 'Enter a valid phone number';
    }
    if (!registerForm.password) {
      errors.password = 'Password is required';
    } else if (registerForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', ...loginForm }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setUser(data.user);
      setShowAuth(false);
      toast.success(`Welcome back, ${data.user.name}!`);
      setLoginForm({ email: '', password: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateRegister()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...registerForm }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setUser(data.user);
      setShowAuth(false);
      toast.success(`Welcome, ${data.user.name}! Account created successfully.`);
      setRegisterForm({ name: '', email: '', phone: '', password: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordForm.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordForm.email)) {
      toast.error('Enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forgot-password',
          email: forgotPasswordForm.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setForgotPasswordSent(true);
      toast.success('If an account with that email exists, a reset link has been sent.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  const handleRegisterKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRegister();
  };

  const handleForgotPasswordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleForgotPassword();
  };

  return (
    <Dialog open={showAuth} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl">
            {effectiveMode === 'login'
              ? 'Welcome Back'
              : effectiveMode === 'register'
                ? 'Create Account'
                : 'Reset Password'}
          </DialogTitle>
          <DialogDescription>
            {effectiveMode === 'login'
              ? 'Sign in to your Ravi Genuine Autos account'
              : effectiveMode === 'register'
                ? 'Join Ravi Genuine Autos to track your orders'
                : "Enter your email and we'll send you a reset link"}
          </DialogDescription>
        </DialogHeader>

        {/* Mode Tabs - only show for login/register */}
        {effectiveMode !== 'forgot-password' && (
          <div className="flex rounded-lg bg-muted p-1">
            <button
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                effectiveMode === 'login'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => switchMode('login')}
            >
              Login
            </button>
            <button
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                effectiveMode === 'register'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => switchMode('register')}
            >
              Register
            </button>
          </div>
        )}

        {/* ── Login Form ───────────────────────────────────── */}
        {effectiveMode === 'login' && (
          <div className="space-y-4" onKeyDown={handleLoginKeyDown}>
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  aria-invalid={!!loginErrors.email}
                />
              </div>
              {loginErrors.email && (
                <p className="text-xs text-destructive">{loginErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <button
                  type="button"
                  className="text-xs font-medium text-[#B91C1C] hover:text-[#DC2626] hover:underline"
                  onClick={() => switchMode('forgot-password')}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  aria-invalid={!!loginErrors.password}
                />
              </div>
              {loginErrors.password && (
                <p className="text-xs text-destructive">
                  {loginErrors.password}
                </p>
              )}
            </div>

            <Button
              className="w-full bg-[#B91C1C] text-white hover:bg-[#DC2626]"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <button
                className="font-medium text-[#B91C1C] hover:text-[#DC2626] hover:underline"
                onClick={() => switchMode('register')}
              >
                Register
              </button>
            </p>
          </div>
        )}

        {/* ── Register Form ────────────────────────────────── */}
        {effectiveMode === 'register' && (
          <div className="space-y-4" onKeyDown={handleRegisterKeyDown}>
            <div className="space-y-2">
              <Label htmlFor="register-name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="register-name"
                  placeholder="Enter your full name"
                  className="pl-10"
                  value={registerForm.name}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  aria-invalid={!!registerErrors.name}
                />
              </div>
              {registerErrors.name && (
                <p className="text-xs text-destructive">{registerErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="register-email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10"
                  value={registerForm.email}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  aria-invalid={!!registerErrors.email}
                />
              </div>
              {registerErrors.email && (
                <p className="text-xs text-destructive">
                  {registerErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="register-phone"
                  type="tel"
                  placeholder="03XX-XXXXXXX"
                  className="pl-10"
                  value={registerForm.phone}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  aria-invalid={!!registerErrors.phone}
                />
              </div>
              {registerErrors.phone && (
                <p className="text-xs text-destructive">
                  {registerErrors.phone}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Min. 6 characters"
                  className="pl-10"
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  aria-invalid={!!registerErrors.password}
                />
              </div>
              {registerErrors.password && (
                <p className="text-xs text-destructive">
                  {registerErrors.password}
                </p>
              )}
            </div>

            <Button
              className="w-full bg-[#B91C1C] text-white hover:bg-[#DC2626]"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                className="font-medium text-[#B91C1C] hover:text-[#DC2626] hover:underline"
                onClick={() => switchMode('login')}
              >
                Login
              </button>
            </p>
          </div>
        )}

        {/* ── Forgot Password Form ──────────────────────────── */}
        {effectiveMode === 'forgot-password' && (
          <div className="space-y-4" onKeyDown={handleForgotPasswordKeyDown}>
            {forgotPasswordSent ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-green-50">
                  <Mail className="size-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Check your email</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    If an account with that email exists, we&apos;ve sent you a password reset link.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-[#B91C1C] text-[#B91C1C] hover:bg-[#B91C1C]/10"
                  onClick={() => switchMode('login')}
                >
                  <ArrowLeft className="size-4" />
                  Back to Login
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="Enter your registered email"
                      className="pl-10"
                      value={forgotPasswordForm.email}
                      onChange={(e) =>
                        setForgotPasswordForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll send you a link to reset your password
                  </p>
                </div>

                <Button
                  className="w-full bg-[#B91C1C] text-white hover:bg-[#DC2626]"
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-[#B91C1C] hover:text-[#DC2626] hover:underline"
                  onClick={() => switchMode('login')}
                >
                  <ArrowLeft className="size-4" />
                  Back to Login
                </button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
