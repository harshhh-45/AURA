'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { ClassSchedule } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { useFirebase, useUser, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { universities } from '@/lib/data';


const formSchema = z.object({
  universityId: z.string().min(1, 'University is required'),
  subject: z.string().min(1, 'Subject is required'),
  section: z.string().min(1, 'Section is required'),
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
});


export function TimetableClient({ initialData, universityId }: { initialData: ClassSchedule[]; universityId: string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      universityId: universityId || '',
      subject: '',
      section: '',
      day: 'Monday',
      startTime: '',
      endTime: '',
    },
  });

  useEffect(() => {
    form.setValue('universityId', universityId || '');
  }, [universityId, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !user) {
        toast({ title: "Error", description: "You must be logged in to add a class.", variant: "destructive"});
        return;
    };
    const resolvedUniversityId = universityId || values.universityId;
    if (!resolvedUniversityId) {
        toast({ title: "Error", description: "University information is missing.", variant: "destructive"});
        return;
    }
    
    const { universityId: _formUniversityId, ...scheduleValues } = values;

    const timetableCollection = collection(firestore, `universities/${resolvedUniversityId}/teachers/${user.uid}/timetables`);

    await addDocumentNonBlocking(timetableCollection, scheduleValues);
    
    toast({
      title: 'Class Added!',
      description: `${scheduleValues.subject} has been added to your schedule.`,
    });
    form.reset();
    setIsDialogOpen(false);
  };
  
  const handleDelete = (id: string) => {
    if (!firestore || !user || !universityId) return;
    const docRef = doc(firestore, `universities/${universityId}/teachers/${user.uid}/timetables`, id);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Class Removed",
        description: "The class has been removed from your schedule.",
        variant: "destructive"
    })
  }

  return (
    <>
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
              <DialogDescription>
                Fill in the details for the new class schedule.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <FormField
                      control={form.control}
                      name="universityId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>University</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!!universityId}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select university" />
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
                 <FormField control={form.control} name="subject" render={({ field }) => (
                    <FormItem><FormLabel>Subject</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="section" render={({ field }) => (
                    <FormItem><FormLabel>Section</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="day" render={({ field }) => (
                    <FormItem><FormLabel>Day</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent>{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                  )} />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="startTime" render={({ field }) => (
                        <FormItem><FormLabel>Start Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="endTime" render={({ field }) => (
                        <FormItem><FormLabel>End Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button type="submit">Add Class</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.length > 0 ? initialData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.subject}</TableCell>
                  <TableCell>{item.section}</TableCell>
                  <TableCell>{item.day}</TableCell>
                  <TableCell>{item.startTime} - {item.endTime}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDelete(item.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No classes scheduled. Add a class to get started.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
