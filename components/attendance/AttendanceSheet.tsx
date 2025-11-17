'use client';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { AttendanceRecord } from '@/lib/types';
import { format } from 'date-fns';
import { Button } from '../ui/button';

interface AttendanceSheetProps {
  universityId: string;
  teacherId: string;
  timetableId: string;
}

export default function AttendanceSheet({ universityId, teacherId, timetableId }: AttendanceSheetProps) {
  const { firestore } = useFirebase();

  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || !universityId || !teacherId || !timetableId) return null;
    return query(
        collection(
            firestore,
            `universities/${universityId}/teachers/${teacherId}/timetables/${timetableId}/attendanceRecords`
        ),
        orderBy('timestamp', 'desc')
    );
  }, [firestore, universityId, teacherId, timetableId]);

  const { data: attendanceRecords, isLoading, error } = useCollection<AttendanceRecord>(attendanceQuery);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex justify-between">
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-5 w-1/4" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
  }

  if (error) {
     return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Fetching Attendance</AlertTitle>
        <AlertDescription>
          There was a problem loading the attendance records. Please check your connection or permissions.
        </AlertDescription>
      </Alert>
    );
  }

  const sortedRecords = attendanceRecords ? [...attendanceRecords].sort((a, b) => b.timestamp - a.timestamp) : [];

  const handleDownloadCsv = () => {
    if (!sortedRecords.length) return;
    const headers = ['Student Name', 'Student ID', 'Timestamp'];
    const rows = sortedRecords.map((record) => [
      record.studentName,
      record.studentId,
      new Date(record.timestamp).toLocaleString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const stringValue = value?.toString().replace(/"/g, '""') ?? '';
            return `"${stringValue}"`;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${timetableId}-${new Date().toISOString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Live Attendance</CardTitle>
          <CardDescription>
            Showing {sortedRecords.length} students who have marked their attendance. Updates in real-time.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadCsv}
          disabled={!sortedRecords.length}
        >
          Download CSV
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead className="text-right">Time Marked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecords.length > 0 ? (
                sortedRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.studentName}</TableCell>
                    <TableCell>
                        <Badge variant="secondary">{record.studentId}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {format(new Date(record.timestamp), 'HH:mm:ss')}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No attendance records yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
