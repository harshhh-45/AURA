'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import type { ClassSchedule } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, useFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

const QR_REFRESH_INTERVAL_MS = 1000; // 1 second
export const ATTENDANCE_SESSION_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface QrCodeDialogProps {
  classInfo: ClassSchedule;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionEnd?: () => void;
}

export default function QrCodeDialog({ classInfo, isOpen, onOpenChange, onSessionEnd }: QrCodeDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const { firestore, user, userProfile } = useFirebase();
  const [sessionTimeLeft, setSessionTimeLeft] = useState(ATTENDANCE_SESSION_DURATION_MS);
  const { toast } = useToast();

  const universityId = userProfile?.universityId ?? null;

  useEffect(() => {
    if (isOpen) {
      // Reset session timer when dialog is opened
      setSessionTimeLeft(ATTENDANCE_SESSION_DURATION_MS);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !user || !firestore || !universityId) return;

    // --- QR Code Value & Saving Logic ---
    const generateAndSaveQrData = () => {
      const expiresAt = Date.now() + QR_REFRESH_INTERVAL_MS * 2; // Expires shortly after refresh
      
      const qrData = {
        universityId,
        teacherId: user.uid,
        timetableId: classInfo.id,
        expiresAt: expiresAt,
      };

      const dataString = JSON.stringify(qrData);
      
      const timetableRef = doc(firestore, `universities/${universityId}/teachers/${user.uid}/timetables`, classInfo.id);
      const qrCodeRef = collection(timetableRef, 'qrCodes');

      // Save the valid QR code information to Firestore for the student to verify against
      addDocumentNonBlocking(qrCodeRef, {
        value: dataString,
        generatedAt: Date.now(),
        expiresAt: expiresAt,
      });

      const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
        dataString
      )}&size=256x256&bgcolor=f0f8ff`;
      setQrCodeUrl(url);
    };
    
    generateAndSaveQrData(); // Generate immediately on open
    const qrInterval = setInterval(generateAndSaveQrData, QR_REFRESH_INTERVAL_MS);

    // --- Session Timer Logic ---
    const sessionTimer = setInterval(() => {
      setSessionTimeLeft((prevTime) => {
        const newTime = prevTime - 1000;
        if (newTime <= 0) {
          onOpenChange(false); // Close the dialog
          toast({
            title: 'Attendance Session Ended',
            description: `The 5-minute window for ${classInfo.subject} has closed.`,
          });
          onSessionEnd?.();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(qrInterval);
      clearInterval(sessionTimer);
    };
  }, [isOpen, classInfo, user, firestore, universityId, onOpenChange, toast, onSessionEnd]);

  const progressValue = (sessionTimeLeft / ATTENDANCE_SESSION_DURATION_MS) * 100;
  const minutes = Math.floor(sessionTimeLeft / 60000);
  const seconds = ((sessionTimeLeft % 60000) / 1000).toFixed(0).padStart(2, '0');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Live Attendance for {classInfo.subject}</DialogTitle>
          <DialogDescription>
            This window will automatically close in 5 minutes. The QR code refreshes every second.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-white rounded-lg shadow-md">
            {qrCodeUrl ? (
              <Image src={qrCodeUrl} alt="Dynamic QR Code" width={256} height={256} unoptimized />
            ) : (
              <div className="w-64 h-64 bg-gray-200 animate-pulse rounded-lg" />
            )}
          </div>

          <div className="w-full space-y-2">
            <div className="flex justify-between font-mono text-sm">
                <span>Session ends in...</span>
                <span>{minutes}:{seconds}</span>
            </div>
            <Progress value={progressValue} className="w-full h-2" />
          </div>
        </div>
         <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            This QR code is dynamic and will refresh to prevent misuse.
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  );
}
