'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { User, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import LoginForm from './LoginForm';
import { useState } from 'react';


export default function LoginOptions() {
  const router = useRouter();
  const [role, setRole] = useState<'teacher' | 'student' | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRoleSelect = (selectedRole: 'teacher' | 'student') => {
    setRole(selectedRole);
    setIsDialogOpen(true);
  };

  const handleSignUpClick = () => {
    if (role) {
      router.push(`/setup?role=${role}`);
      setIsDialogOpen(false);
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={() => handleRoleSelect('teacher')} size="lg" className="w-full sm:w-auto">
          <Shield className="mr-2 h-4 w-4" />
          I am a Teacher
        </Button>
        <Button onClick={() => handleRoleSelect('student')} size="lg" variant="outline" className="w-full sm:w-auto">
          <User className="mr-2 h-4 w-4" />
          I am a Student
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in as a {role}</DialogTitle>
            <DialogDescription>
              Enter your credentials to access your dashboard.
            </DialogDescription>
          </DialogHeader>
          {role && <LoginForm role={role} />}
          <div className="text-center text-sm text-muted-foreground mt-4">
            Don&apos;t have an account?{' '}
            <Button variant="link" className="p-0 h-auto" onClick={handleSignUpClick}>
              Sign up
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
