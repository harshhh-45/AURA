'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import QrCodeDialog, { ATTENDANCE_SESSION_DURATION_MS } from '@/components/attendance/QrCodeDialog';
import type { ClassSchedule } from '@/lib/types';
import { Clock, PlayCircle, BookOpen, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function TodaySchedule({ schedule }: { schedule: ClassSchedule[] }) {
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [activeSessions, setActiveSessions] = useState<Record<string, number>>({});
  const STORAGE_KEY = 'activeAttendanceSessions';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, number>;
        const now = Date.now();
        const filtered: Record<string, number> = {};
        Object.entries(parsed).forEach(([key, expiresAt]) => {
          if (expiresAt > now) {
            filtered[key] = expiresAt;
          }
        });
        setActiveSessions(filtered);
      }
    } catch {
      setActiveSessions({});
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeSessions));
  }, [activeSessions]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSessions((prev) => {
        const now = Date.now();
        const filtered: Record<string, number> = {};
        let changed = false;
        Object.entries(prev).forEach(([key, expiresAt]) => {
          if (expiresAt > now) {
            filtered[key] = expiresAt;
          } else {
            changed = true;
          }
        });
        return changed ? filtered : prev;
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = days[new Date().getDay()];

  // Correctly filter the schedule to get only today's classes
  const todaySchedule = schedule.filter((classItem) => classItem.day === today);

  const handleStartAttendance = (classItem: ClassSchedule) => {
    setSelectedClass(classItem);
    setIsQrDialogOpen(true);
    setActiveSessions((prev) => ({
      ...prev,
      [classItem.id]: Date.now() + ATTENDANCE_SESSION_DURATION_MS,
    }));
  };

  const handleSessionEnd = (timetableId: string) => {
    setActiveSessions((prev) => {
      const updated = { ...prev };
      delete updated[timetableId];
      return updated;
    });
  };

  const isClassActive = (classId: string) => {
    const expiresAt = activeSessions[classId];
    if (!expiresAt) return false;
    return expiresAt > Date.now();
  };
  
  if (todaySchedule.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[400px]">
            <h3 className="text-xl font-semibold tracking-tight">No Classes Today</h3>
            <p className="text-sm text-muted-foreground">Enjoy your day off! Check your full schedule in the Timetable tab.</p>
        </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {todaySchedule.map((classItem) => (
          <Card key={classItem.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <Badge variant="secondary">{classItem.section}</Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4"/>
                    <span>{classItem.startTime} - {classItem.endTime}</span>
                </div>
              </div>
              <CardTitle className="pt-4">{classItem.subject}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Section {classItem.section}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow" />
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                className="w-full"
                onClick={() => handleStartAttendance(classItem)}
                disabled={isClassActive(classItem.id)}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                {isClassActive(classItem.id) ? 'Attendance In Progress' : 'Start Attendance'}
              </Button>
               <Button asChild variant="outline" className="w-full">
                <Link href={`/dashboard/attendance/${classItem.section}/${classItem.id}`}>
                    <ListChecks className="mr-2 h-4 w-4" />
                    View Attendance
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {selectedClass && (
        <QrCodeDialog
          classInfo={selectedClass}
          isOpen={isQrDialogOpen}
          onOpenChange={setIsQrDialogOpen}
          onSessionEnd={() => handleSessionEnd(selectedClass.id)}
        />
      )}
    </>
  );
}
