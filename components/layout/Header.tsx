'use client';

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
import { CircleUser, LogOut, User } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import { useAuth, useFirebase } from '@/firebase';
import Link from 'next/link';

export default function Header() {
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
    if (parts.length > 1 && parts[parts.length -1]) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex w-full items-center justify-end">
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
                  {userProfile?.role ? `${userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}` : 'Role not found'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
             <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/dashboard/profile">
                <User className="mr-2 h-4 w-4" />
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
