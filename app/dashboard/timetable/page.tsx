'use client';

import { TimetableClient } from "@/components/timetable/TimetableClient";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from 'firebase/firestore';
import type { ClassSchedule } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function TimetablePage() {
    const { firestore, user, isUserLoading, userProfile, isUserProfileLoading } = useFirebase();
    const universityId = userProfile?.universityId || null;

    const timetableQuery = useMemoFirebase(() => {
        if (!firestore || !user || !universityId) return null;
        return collection(firestore, `universities/${universityId}/teachers/${user.uid}/timetables`);
    }, [firestore, user, universityId]);

    const { data: schedule, isLoading } = useCollection<ClassSchedule>(timetableQuery);

    if (isLoading || isUserLoading || isUserProfileLoading || !universityId) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Timetable Management</h1>
                <p className="text-muted-foreground">Add, view, and manage your class schedule.</p>
            </div>
            <TimetableClient initialData={schedule || []} universityId={universityId} />
        </div>
    );
}
