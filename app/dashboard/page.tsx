'use client';

import TodaySchedule from "@/components/dashboard/TodaySchedule";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from 'firebase/firestore';
import type { ClassSchedule } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { firestore, user, isUserLoading, userProfile, isUserProfileLoading } = useFirebase();
  
  const universityId = userProfile?.universityId || null;
  
  const scheduleQuery = useMemoFirebase(() => {
    if (!firestore || !user || !universityId) return null;
    return collection(firestore, `universities/${universityId}/teachers/${user.uid}/timetables`);
  }, [firestore, user, universityId]);

  const { data: schedule, isLoading: isScheduleLoading } = useCollection<ClassSchedule>(scheduleQuery);

  if (isUserLoading || isUserProfileLoading || isScheduleLoading || !universityId) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      )
  }

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Here are your classes for today. Click to start taking attendance.</p>
      </div>
      <TodaySchedule schedule={schedule || []} />
    </div>
  );
}
