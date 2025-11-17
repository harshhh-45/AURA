'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth, useFirebase } from '@/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CircleUser, LogOut, LayoutGrid, User as UserIcon } from 'lucide-react';
import { QrCode } from 'lucide-react';
import Link from 'next/link';

function Header() {
  const router = useRouter();
  const auth = useAuth();
  const { userProfile } = useFirebase();

  const handleLogout = () => {
    auth.signOut();
    localStorage.removeItem('setupComplete');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userRole');
    router.push('/');
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
       <Link href="/student/dashboard" className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary text-primary-foreground">
            <QrCode className="h-6 w-6" />
          </div>
          <span className="font-bold text-lg text-primary">Attendify QR</span>
        </Link>
      <nav className="flex-1 flex justify-center items-center">
        <Button variant="ghost" asChild>
            <Link href="/student/dashboard/attendance">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Attendance History
            </Link>
        </Button>
      </nav>
      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder-user.jpg" alt="User avatar" />
                <AvatarFallback>
                  {userProfile ? getInitials(userProfile.name) : <CircleUser />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userProfile?.name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  Student
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
             <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/student/dashboard/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}


export default function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
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
      const roleQuery = storedRole ? `?role=${storedRole}` : '?role=student';
      router.replace(`/setup${roleQuery}`);
      return;
    }

    if (userProfile.role !== 'student') {
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
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  );
}
