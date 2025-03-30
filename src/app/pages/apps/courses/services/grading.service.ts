import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { Homework } from '../models/homework.model';
import { Student } from '../models/Student.model';
import { HomeworkSubmission } from '../models/homeworkSubmission.model';
import { AuthService } from 'src/app/pages/authentication/services/auth.service';

export interface StudentSubmission {
  student: {
    id: string;
    name: string;
    email: string;
  };
  submission:
  | 'Not submitted'
  | {
    submissionID: number;
    uploadsIds: number[];
    grade: number | 'Not graded';
    feedback: string | 'Not graded';
  };
}

@Injectable({ providedIn: 'root' })
export class GradingService {
  private apiUrl = 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getHomeworksByCourse(courseId: number): Observable<Homework[]> {
    return this.http.get<Homework[]>(`${this.apiUrl}/homework/course/${courseId}`);
  }

  getStudentsByCourse(courseId: number): Observable<Student[]> {
    return this.http.get<{ students: Student[] }>(`${this.apiUrl}/courses/${courseId}/students`)
      .pipe(
        map(response => response.students)
      );
  }


  getSubmissionsByHomework(homeworkId: number): Observable<StudentSubmission[]> {
    return this.http.get<StudentSubmission[]>(
      `${this.apiUrl}/homework-submissions/${homeworkId}/students-submissions`
    );
  }

  updateGrade(
    submissionId: number,
    data: { grade: number; feedback: string }
  ): Observable<HomeworkSubmission> {
    return this.http.patch<HomeworkSubmission>(
      `${this.apiUrl}/homework-submissions/${submissionId}/grade`,
      data
    );
  }
  getFileUrl(uploadId: number): string { 
    const token = this.authService.getToken();
    return `${this.apiUrl}/files/${uploadId}?token=${token}`; }

  downloadFile(fileUrl: string): Observable<Blob> {
    return this.http.get(fileUrl, { responseType: 'blob' });
  }
}
