'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import {
  User,
  Mail,
  Phone,
  MapPin,
  LogOut,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AccountView() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const setShowAuth = useAppStore((s) => s.setShowAuth);
  const setView = useAppStore((s) => s.setView);

  const handleLogout = () => {
    setUser(null);
    setView('home');
    toast.success('Logged out successfully');
  };

  // ── Not Logged In ──────────────────────────────────────────
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl py-8 sm:py-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-24 items-center justify-center rounded-full bg-amber-50">
            <User className="size-10 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Sign in to your account
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Login to view your profile, track orders, and manage your account
            </p>
          </div>
          <Button
            className="bg-amber-600 text-white hover:bg-amber-700"
            size="lg"
            onClick={() => setShowAuth(true, 'login')}
          >
            Login / Register
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Logged In ──────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="mb-8 text-2xl font-bold text-foreground sm:text-3xl">
        My Account
      </h1>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <User className="size-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{user.name}</CardTitle>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShieldCheck className="size-3.5 text-green-600" />
                Verified Account
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-0">
          <Separator />

          {/* Name */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <User className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="text-sm font-medium text-foreground">{user.name}</p>
            </div>
          </div>

          <Separator />

          {/* Email */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Mail className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{user.email}</p>
            </div>
          </div>

          <Separator />

          {/* Phone */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Phone className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium text-foreground">
                {user.phone || 'Not provided'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Address */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <MapPin className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="text-sm font-medium text-foreground">
                {user.address
                  ? `${user.address}${user.city ? `, ${user.city}` : ''}`
                  : 'Not provided'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Logout */}
          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
