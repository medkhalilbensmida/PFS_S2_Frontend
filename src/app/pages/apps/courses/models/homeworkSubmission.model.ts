export interface HomeworkSubmission {
  id: number;
  grade?: number;
  feedback?: string;
  fileUrl?: string;
  studentId: string;
  homeworkId: number;
  uploadIds?: number[]; 
}
