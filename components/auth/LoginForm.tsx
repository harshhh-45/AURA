'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const FormSchema = z.object({
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginFormProps = {
  role: 'teacher' | 'student';
};

export default function LoginForm({ role }: LoginFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    initiateEmailSignIn(auth, data.email, data.password);
    localStorage.setItem('userRole', role);
    
    // Listen for auth change
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        toast({
          title: 'Signed In!',
          description: "Welcome back!",
        });
        if (role === 'teacher') {
          router.push('/dashboard');
        } else {
          router.push('/student/dashboard');
        }
        unsubscribe(); // Clean up listener
      } else {
        // This might be tricky because errors are handled globally
        // For now, we assume global error handling will show a toast for failed login
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
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
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
    </Form>
  );
}
