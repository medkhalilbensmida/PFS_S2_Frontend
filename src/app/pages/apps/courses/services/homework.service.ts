import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Homework } from '../models/homework.model';
import { CreateHomeworkDTO } from '../models/create-homework-dto';
import { HomeworkSubmissionDto } from '../models/homework-submission.dto';

@Injectable({
  providedIn: 'root',
})
export class HomeworkService {
  private API_URL = 'http://localhost:3000';

  constructor(private http: HttpClient) { }


  getHomeworkByCourse(courseId: number): Observable<Homework[]> {

    return this.http.get<Homework[]>(
      `${this.API_URL}/homework/course/${courseId}`

    );
  }


  getHomeworkById(id: number): Observable<Homework> {

    return this.http.get<Homework>(`${this.API_URL}/homework/${id}`);
  }

  createHomework(
    createHomeworkDTO: CreateHomeworkDTO,
    files: File[],
  ): Observable<any> {
    const formData = new FormData();

    // Append form data
    formData.append('title', createHomeworkDTO.title);
    formData.append('description', createHomeworkDTO.description);
    formData.append('deadline', createHomeworkDTO.deadline);
    formData.append('courseId', createHomeworkDTO.courseId.toString());

    // Append files to FormData
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });


    return this.http.post<any>(`${this.API_URL}/homework`, formData);
  }

  deleteHomework(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/homework/${id}`);
  }



  fetchStudentSubmission(homeworkId: number): Observable<HomeworkSubmissionDto> {
    return this.http.get<any>(`${this.API_URL}/homework-submissions/${homeworkId}`);
  }

  createSubmission(
    homeworkId :number,
    files: File[],
  ): Observable<any> {
    const formData = new FormData();

    formData.append('homeworkId', homeworkId.toString());

    files.forEach((file) => {
      formData.append('files', file, file.name);
    });

    return this.http.post<any>(`${this.API_URL}/homework-submissions`, formData);
  }
}