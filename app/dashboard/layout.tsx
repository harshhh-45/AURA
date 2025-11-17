'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirebase } from '@/firebase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isUserLoading, userProfile, isUserProfileLoading } = useFirebase();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (isUserLoading || isUserProfileLoading) return;

    if (!user) {
      router.replace('/');
      return;
    }

    if (!userProfile) {
      const storedRole =
        typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
      const roleQuery = storedRole ? `?role=${storedRole}` : '';
      router.replace(`/setup${roleQuery}`);
      return;
    }

    if (userProfile.role !== 'teacher') {
      router.replace('/');
      return;
    }

    setIsVerified(true);
  }, [user, userProfile, isUserLoading, isUserProfileLoading, router]);

  if (!isVerified || isUserLoading || isUserProfileLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
