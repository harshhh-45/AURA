import type { ClassSchedule } from './types';

export const universities = [
  { value: 'stanford', label: 'Stanford University' },
  { value: 'mit', label: 'Massachusetts Institute of Technology' },
  { value: 'harvard', label: 'Harvard University' },
  { value: 'caltech', label: 'California Institute of Technology' },
  { value: 'oxford', label: 'University of Oxford' },
];

export const initialSchedule: ClassSchedule[] = [
  {
    id: 'timetable-cs101-mon', // Corresponds to timetableId
    subject: 'Introduction to Computer Science',
    section: 'section-a', // Corresponds to sectionId
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:30',
  },
  {
    id: 'timetable-ma201-tue',
    subject: 'Advanced Calculus',
    section: 'section-b',
    day: 'Tuesday',
    startTime: '11:00',
    endTime: '12:30',
  },
  {
    id: 'timetable-phy305-wed',
    subject: 'Quantum Mechanics',
    section: 'section-a',
    day: 'Wednesday',
    startTime: '14:00',
    endTime: '15:30',
  },
  {
    id: 'timetable-cs101-thu',
    subject: 'Introduction to Computer Science',
    section: 'section-a',
    day: 'Thursday',
    startTime: '09:00',
    endTime: '10:30',
  },
    {
    id: 'timetable-ee401-fri',
    subject: 'Digital Signal Processing',
    section: 'section-c',
    day: 'Friday',
    startTime: '10:00',
    endTime: '11:30',
  },
];
