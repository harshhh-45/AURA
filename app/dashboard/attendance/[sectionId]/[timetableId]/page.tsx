'use client';

import { Suspense, use } from 'react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import AttendanceSheet from '@/components/attendance/AttendanceSheet';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { doc } from 'firebase/firestore';
import type { ClassSchedule } from '@/lib/types';


function AttendancePageContent({ params }: { params: { sectionId: string, timetableId: string } }) {
  const { user, isUserLoading, userProfile, isUserProfileLoading, firestore } = useFirebase();
  const universityId = userProfile?.universityId || null;

  const timetableRef = useMemoFirebase(() => {
    if (!firestore || !universityId || !user) return null;
    return doc(firestore, `universities/${universityId}/teachers/${user.uid}/timetables`, params.timetableId);
  }, [firestore, universityId, user, params.timetableId]);

  const { data: classInfo, isLoading: isClassInfoLoading } = useDoc<ClassSchedule>(timetableRef);

  if (isUserLoading || isUserProfileLoading || !universityId || isClassInfoLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
            <Button asChild variant="ghost" className="mb-4">
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
                {classInfo?.subject || 'Class Attendance'}
            </h1>
            <p className="text-muted-foreground">
                Section: {classInfo?.section || params.sectionId} | Date: {new Date().toLocaleDateString()}
            </p>
        </div>
      
      <AttendanceSheet 
        universityId={universityId} 
        teacherId={user!.uid}
        timetableId={params.timetableId} 
      />
    </div>
  );
}

export default function AttendancePage({ params }: { params: { sectionId: string, timetableId:string } }) {
    return (
        <Suspense fallback={<Skeleton className="h-screen w-full" />}>
            <AttendancePageContent params={params} />
        </Suspense>
    )
}
