'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // For auth errors (which we've given a path starting with 'auth/'), we show a toast.
      // For actual Firestore security rules errors, we re-throw to get the Next.js dev overlay.
      if (error.request.path.includes('auth/')) {
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: error.request.resource?.data?.error || 'An unknown authentication error occurred.',
        });
      } else {
        // For other errors (like Firestore permissions), re-throw to get the Next.js overlay
        throw error;
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  // This component renders nothing.
  return null;
}
