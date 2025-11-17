'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, BookCheck, BarChart3, User, History, LayoutGrid } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, addDocumentNonBlocking } from '@/firebase';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import jsQR from 'jsqr';
import type { StudentInfo } from '@/lib/types';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import Link from 'next/link';

export default function StudentDashboardClient() {
  const { user, isUserLoading, userProfile, isUserProfileLoading, firestore } = useFirebase();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

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

  const scanQrCode = useCallback(async () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current && userInfo && firestore) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          try {
             setIsScanning(false); // Stop scanning immediately
            const qrData = JSON.parse(code.data);
            
            // 1. Validate QR data structure
            if (!qrData.universityId || !qrData.teacherId || !qrData.timetableId || !qrData.expiresAt) {
               throw new Error("Invalid QR code format.");
            }

            // 2. Check if QR code is expired
            if (Date.now() > qrData.expiresAt) {
                 toast({
                    variant: "destructive",
                    title: "QR Code Expired",
                    description: "This QR code is no longer valid. Please ask for a new one.",
                });
                return;
            }

            // 3. Verify the QR code exists in the teacher's valid codes
            const qrCodeCollectionRef = collection(firestore, `universities/${qrData.universityId}/teachers/${qrData.teacherId}/timetables/${qrData.timetableId}/qrCodes`);
            const q = query(qrCodeCollectionRef, where("value", "==", code.data), limit(1));
            const qrSnapshot = await getDocs(q);

            if (qrSnapshot.empty) {
                toast({
                    variant: "destructive",
                    title: "Invalid QR Code",
                    description: "This QR code is not recognized by the system.",
                });
                return;
            }

            // 4. If valid, record attendance
              const attendanceRecord = {
                studentId: userInfo.id,
                studentName: userInfo.name,
                timestamp: Date.now(),
                qrCodeValue: code.data,
                timetableId: qrData.timetableId,
                studentUid: userInfo.uid,
              };

            const attendanceRef = collection(
                firestore,
                `universities/${qrData.universityId}/teachers/${qrData.teacherId}/timetables/${qrData.timetableId}/attendanceRecords`
              );
              
              addDocumentNonBlocking(attendanceRef, attendanceRecord);

              toast({
                title: "Attendance Marked!",
                description: "Your attendance has been successfully recorded.",
              });

          } catch (e) {
            console.error("Failed to parse QR code or save attendance", e);
            toast({
              variant: "destructive",
              title: "Scan Failed",
              description: e instanceof Error ? e.message : "An unknown error occurred.",
            });
          }
        }
      }
    }
    if (isScanning) {
        requestRef.current = requestAnimationFrame(scanQrCode);
    }
  }, [firestore, toast, userInfo, isScanning]);


  useEffect(() => {
    if (isScanning) {
      requestRef.current = requestAnimationFrame(scanQrCode);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isScanning, scanQrCode]);


  useEffect(() => {
    let stream: MediaStream | null = null;
    const videoElement = videoRef.current;

    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to scan QR codes.',
        });
        setIsScanning(false);
      }
    };

    if (isScanning) {
      getCameraPermission();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoElement) {
          videoElement.srcObject = null;
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }
  }, [isScanning, toast]);

  if (isUserLoading || isUserProfileLoading || !userInfo) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  const handleScanClick = () => {
    setIsScanning(!isScanning);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {userInfo.name}!</h1>
        <p className="text-muted-foreground">Your student dashboard is ready.</p>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {isScanning ? (
        <Card>
          <CardHeader>
            <CardTitle>Scan QR Code</CardTitle>
            <CardDescription>Point your camera at the QR code to mark your attendance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <video ref={videoRef} className="w-full max-w-md aspect-video rounded-md bg-muted" autoPlay muted playsInline />
              {hasCameraPermission === false && (
                <Alert variant="destructive">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access to use this feature. You may need to change permissions in your browser settings.
                  </AlertDescription>
                </Alert>
              )}
              <Button onClick={handleScanClick} variant="outline">Cancel Scan</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center">
            <CardHeader>
                <CardTitle>Mark Your Attendance</CardTitle>
                <CardDescription>Click the button below to open your camera and scan the QR code provided by your teacher.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button size="lg" onClick={handleScanClick}>
                    <QrCode className="mr-2" /> Scan Attendance QR Code
                </Button>
            </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Profile</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{userInfo.name}</div>
            <p className="text-xs text-muted-foreground">ID: {userInfo.id}</p>
          </CardContent>
           <CardFooter>
            <Button asChild className="w-full" variant="outline">
                <Link href="/student/dashboard/profile">
                    View Profile
                </Link>
            </Button>
           </CardFooter>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance History</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">View All</div>
            <p className="text-xs text-muted-foreground">See a detailed log of your attendance.</p>
          </CardContent>
           <CardFooter>
             <Button asChild className="w-full" variant="outline">
                <Link href="/student/dashboard/attendance">
                    View History
                </Link>
            </Button>
           </CardFooter>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Courses</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5 Courses</div>
            <p className="text-xs text-muted-foreground">Enrolled for this semester</p>
          </CardContent>
           <CardFooter>
             <Button className="w-full" variant="outline" disabled>
                View Courses
             </Button>
           </CardFooter>
        </Card>
      </div>
    </div>
  );
}
