'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, LayoutDashboard, QrCode, User } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const AppLogo = () => (
    <div className="p-2 rounded-lg bg-primary text-primary-foreground">
        <QrCode className="h-6 w-6" />
    </div>
);


export default function AppSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/timetable', label: 'Timetable', icon: Calendar },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
  ];

  return (
    <Sidebar className="border-r">
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-3">
          <AppLogo />
          <span className="font-bold text-lg text-primary">Attendify QR</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
