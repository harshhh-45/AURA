'use client';

import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Building, Library } from 'lucide-react';
import { universities } from '@/lib/data';
import type { StudentInfo } from '@/lib/types';

export default function StudentProfilePage() {
  const { user, isUserLoading, userProfile, isUserProfileLoading, firestore } = useFirebase();

  const universityId = userProfile?.universityId || null;

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user || !universityId) return null;
    return doc(firestore, `universities/${universityId}/students`, user.uid);
  }, [firestore, user, universityId]);

  const { data: profile, isLoading } = useDoc<StudentInfo>(profileRef);

  if (isLoading || isUserLoading || isUserProfileLoading || !userProfile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-2/3" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const universityLabel = universities.find(u => u.value === profile?.universityId)?.label || profile?.universityId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Your personal and academic information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User /> {profile?.name}
          </CardTitle>
          <CardDescription>Student Profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-3">
            <Library className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Student ID</p>
              <p className="font-medium">{profile?.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5 text-muted-foreground" />
             <div>
              <p className="text-muted-foreground">University</p>
              <p className="font-medium">{universityLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
