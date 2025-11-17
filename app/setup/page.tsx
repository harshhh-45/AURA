'use client';
import { SetupForm } from '@/components/setup/SetupForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role');

  if (!role || (role !== 'teacher' && role !== 'student')) {
    // Redirect if role is invalid or not present
    if (typeof window !== 'undefined') {
      router.replace('/');
    }
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">
            One-Time Setup for {role === 'teacher' ? 'Teacher' : 'Student'}
          </CardTitle>
          <CardDescription>
            Please provide your details to personalize your experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetupForm role={role} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SetupContent />
    </Suspense>
  )
}
