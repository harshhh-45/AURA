
export type ClassSchedule = {
  id: string; // This will now be the timetableId
  subject: string;
  section: string; // This is the sectionId
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
};

export type TeacherInfo = {
  university: string;
  teacherId: string;
  name: string;
};

export type StudentInfo = {
    universityId: string;
    id: string; // This is the student's ID (e.g. S-12345)
    uid: string; // This is the firebase auth user id
    name: string;
}

export type AttendanceRecord = {
  id: string; // The document ID from firestore
  studentId: string; // The student's ID (e.g. S-12345)
  studentName: string;
  timestamp: number; // The time the attendance was marked
  timetableId: string;
  studentUid: string;
  qrCodeValue: string;
}

export type UserProfile = {
  uid: string;
  role: 'teacher' | 'student';
  id: string;
  name: string;
  universityId: string;
  setupComplete?: boolean;
}
