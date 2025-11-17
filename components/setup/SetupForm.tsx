'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { universities } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirebase, useUser } from '@/firebase';
import { initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';

const teacherSchema = z.object({
  university: z.string({ required_error: 'Please select a university.' }),
  teacherId: z.string().min(1, 'Teacher ID is required.'),
  name: z.string().min(1, "Name is required."),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const studentSchema = z.object({
  university: z.string({ required_error: 'Please select a university.' }),
  studentId: z.string().min(1, 'Student ID is required.'),
  name: z.string().min(1, "Name is required."),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SetupFormProps = {
  role: 'teacher' | 'student';
};

export function SetupForm({ role }: SetupFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const FormSchema = role === 'teacher' ? teacherSchema : studentSchema;

  useEffect(() => {
    const setupComplete = localStorage.getItem('setupComplete');
    if (!isUserLoading && user && setupComplete === 'true') {
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'teacher') {
            router.replace('/dashboard');
        } else if (userRole === 'student') {
            router.replace('/student/dashboard');
        }
    }
  }, [user, isUserLoading, router]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      university: '',
      name: '',
      email: '',
      password: '',
      ...(role === 'teacher' ? { teacherId: '' } : { studentId: '' }),
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    // 1. Set the user role in localStorage immediately
    localStorage.setItem('userRole', role);

    // 2. Set up a listener for the auth state change
    const unsubscribe = auth.onAuthStateChanged(async (newUser) => {
      if (newUser) {
        // 4. Once the new user is created, save their profile
        await saveUserProfile(newUser.uid, data);
        unsubscribe(); // 5. Clean up the listener
      }
    });

    // 3. Initiate the sign-up process. The listener above will handle the next step.
    initiateEmailSignUp(auth, data.email, data.password);
  }

  const saveUserProfile = async (uid: string, data: z.infer<typeof FormSchema>) => {
    if (!firestore) return;

    let profileData: any;
    let collectionPath: string;

    if (role === 'teacher' && 'teacherId' in data) {
        collectionPath = `universities/${data.university}/teachers`;
        profileData = {
            id: data.teacherId, // The teacher's own ID
            name: data.name,
            universityId: data.university,
        };
    } else if (role === 'student' && 'studentId' in data) {
        collectionPath = `universities/${data.university}/students`;
        profileData = {
            id: data.studentId, // The student's own ID
            name: data.name,
            universityId: data.university,
        };
    } else {
        toast({ variant: 'destructive', title: 'Invalid role data' });
        return;
    }
    
    // The document ID in the collection will be the user's auth UID
    const docRef = doc(firestore, collectionPath, uid);
    setDocumentNonBlocking(docRef, profileData, { merge: true });

    const userProfileData = {
        ...profileData,
        uid,
        role,
        setupComplete: true,
    };

    const userProfileRef = doc(firestore, 'userProfiles', uid);
    setDocumentNonBlocking(userProfileRef, userProfileData, { merge: true });

    // Store all necessary info for the app to use
    localStorage.setItem('setupComplete', 'true');
    localStorage.setItem('userInfo', JSON.stringify(userProfileData));
    localStorage.setItem('userRole', role);
    
    toast({
      title: "Setup Complete!",
      description: "You're all set. Welcome!",
    });

    // Redirect to the correct dashboard
    if (role === 'teacher') {
        router.push('/dashboard');
    } else {
        router.push('/student/dashboard');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="university"
          render={({ field }) => (
            <FormItem>
              <FormLabel>University</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your university" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {universities.map((uni) => (
                    <SelectItem key={uni.value} value={uni.value}>
                      {uni.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {role === 'teacher' ? (
          <FormField
            control={form.control}
            name="teacherId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teacher ID</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., T-12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student ID</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., S-67890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
         <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" variant="default">
          Proceed to Dashboard
        </Button>
      </form>
    </Form>
  );
}
