'use client';

import { useFirebase } from '@/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CalendarCheck, CalendarX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { AttendanceRecord, ClassSchedule, StudentInfo } from '@/lib/types';
import { format } from 'date-fns';

type EnrichedAttendanceRecord = AttendanceRecord & {
  subject: string;
  section: string;
};

export default function StudentAttendancePage() {
  const { user, isUserLoading, userProfile, isUserProfileLoading, firestore } = useFirebase();
  const userInfo: StudentInfo | null = useMemo(() => {
    if (userProfile && userProfile.role === 'student') {
      return {
        id: userProfile.id,
        name: userProfile.name,
        universityId: userProfile.universityId,
        uid: userProfile.uid,
      };
    }
    return null;
  }, [userProfile]);
  const [allRecords, setAllRecords] = useState<EnrichedAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore || !user || !userInfo) return;

    const fetchAllAttendance = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const timetablesSnapshot = await getDocs(
          query(collection(firestore, `universities/${userInfo.universityId}/teachers`))
        );
        
        let allAttendance: EnrichedAttendanceRecord[] = [];
        const timetablePromises = [];

        // This is a simplified approach. A real-world app would need a more direct way
        // to find a student's classes rather than iterating through all teachers.
        // For this prototype, we assume the student might be in any teacher's class.
        for (const teacherDoc of timetablesSnapshot.docs) {
           const teacherTimetableCollection = collection(firestore, `universities/${userInfo.universityId}/teachers/${teacherDoc.id}/timetables`);
           timetablePromises.push(getDocs(teacherTimetableCollection));
        }
        
        const timetableResults = await Promise.all(timetablePromises);

        const attendancePromises = [];

        for (let i = 0; i < timetableResults.length; i++) {
          const timetables = timetableResults[i];
          for (const timetableDoc of timetables.docs) {
              const attendanceQuery = query(
                  collection(firestore, timetableDoc.ref.path, 'attendanceRecords'),
                  where('studentUid', '==', user.uid),
                  orderBy('timestamp', 'desc')
              );
              attendancePromises.push(
                  getDocs(attendanceQuery).then(snapshot => ({
                      records: snapshot.docs.map(doc => doc.data() as AttendanceRecord),
                      subject: (timetableDoc.data() as ClassSchedule).subject,
                      section: (timetableDoc.data() as ClassSchedule).section,
                  }))
              );
          }
        }
        
        const attendanceResults = await Promise.all(attendancePromises);

        for (const result of attendanceResults) {
            allAttendance.push(...result.records.map(rec => ({...rec, subject: result.subject, section: result.section})));
        }

        setAllRecords(allAttendance.sort((a,b) => b.timestamp - a.timestamp));

      } catch (err) {
        console.error("Error fetching attendance: ", err);
        setError("Could not fetch attendance records. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllAttendance();
  }, [firestore, user, userInfo]);

  if (isLoading || isUserLoading || isUserProfileLoading || !userInfo) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const recordsByCourse = allRecords.reduce((acc, record) => {
    const courseKey = `${record.subject} - ${record.section}`;
    if (!acc[courseKey]) {
      acc[courseKey] = [];
    }
    acc[courseKey].push(record);
    return acc;
  }, {} as Record<string, EnrichedAttendanceRecord[]>);

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance History</h1>
        <p className="text-muted-foreground">A detailed log of your attendance for each course.</p>
      </div>
      <Card>
        <CardContent className="p-4 md:p-6">
            {Object.keys(recordsByCourse).length > 0 ? (
                 <Accordion type="single" collapsible className="w-full">
                    {Object.entries(recordsByCourse).map(([courseName, records]) => (
                        <AccordionItem value={courseName} key={courseName}>
                            <AccordionTrigger className="text-lg font-semibold">
                                <div className="flex items-center justify-between w-full pr-4">
                                     <span>{courseName}</span>
                                     <Badge>{records.length} records</Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-3 pl-2 border-l-2 ml-2">
                                {records.map((record, index) => (
                                    <li key={index} className="flex items-center gap-4">
                                        <CalendarCheck className="h-5 w-5 text-green-500" />
                                        <div>
                                            <p className="font-medium">Present</p>
                                            <p className="text-sm text-muted-foreground">
                                            {format(new Date(record.timestamp), "PPP 'at' p")}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                 </Accordion>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[200px]">
                    <h3 className="text-xl font-semibold tracking-tight">No Attendance Records Found</h3>
                    <p className="text-sm text-muted-foreground">Scan a QR code in class to see your records here.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
