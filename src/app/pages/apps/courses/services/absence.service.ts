import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { APP_ROUTES } from 'src/app/pages/authentication/app-routes.config';
import { APP_API } from 'src/app/pages/authentication/app-api.config';
import { AuthService } from 'src/app/pages/authentication/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AbsenceService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) { }

  getAbsenceList(courseId: string): Observable<any[]> {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate([APP_ROUTES.login]);
      return throwError(() => new Error('Not authenticated'));
    }

    if (!this.authService.isTeacher()) {
      this.router.navigate([APP_ROUTES.unauthorized]);
      return throwError(() => new Error('Unauthorized access'));
    }

    const url = `${APP_API.baseUrl}/absences/teacher/absence-list?courseId=${courseId}`;
    return this.http.get<any[]>(url).pipe(
      catchError((error) => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  getAbsenceCounts(courseId: string): Observable<any[]> {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate([APP_ROUTES.login]);
      return throwError(() => new Error('Not authenticated'));
    }

    if (!this.authService.isTeacher()) {
      this.router.navigate([APP_ROUTES.unauthorized]);
      return throwError(() => new Error('Unauthorized access'));
    }

    const url = `${APP_API.baseUrl}/absences/teacher/count-absence-list?courseId=${courseId}`;
    return this.http.get<any[]>(url).pipe(
      catchError((error) => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  addAbsence(absenceData: any): Observable<any> {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate([APP_ROUTES.login]);
      return throwError(() => new Error('Not authenticated'));
    }

    if (!this.authService.isTeacher()) {
      this.router.navigate([APP_ROUTES.unauthorized]);
      return throwError(() => new Error('Unauthorized access'));
    }

    const url = `${APP_API.baseUrl}/absences/teacher`;
    return this.http.post(url, absenceData).pipe(
      catchError((error) => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  validateAbsence(absenceId: number): Observable<any> {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate([APP_ROUTES.login]);
      return throwError(() => new Error('Not authenticated'));
    }

    if (!this.authService.isTeacher()) {
      this.router.navigate([APP_ROUTES.unauthorized]);
      return throwError(() => new Error('Unauthorized access'));
    }

    const url = `${APP_API.baseUrl}/absences/teacher/${absenceId}/validate`;
    return this.http.patch(url, {}).pipe(
      catchError((error) => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  getStudentAbsences(courseId: string): Observable<any[]> {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate([APP_ROUTES.login]);
      return throwError(() => new Error('Not authenticated'));
    }

    if (!this.authService.isStudent()) {
      this.router.navigate([APP_ROUTES.unauthorized]);
      return throwError(() => new Error('Unauthorized access'));
    }

    const url = `${APP_API.baseUrl}/absences/student/absence-course?courseId=${courseId}`;
    return this.http.get<any[]>(url).pipe(
      catchError((error) => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  justifyAbsence(absenceId: number, justification: string): Observable<any> {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate([APP_ROUTES.login]);
      return throwError(() => new Error('Not authenticated'));
    }

    if (!this.authService.isStudent()) {
      this.router.navigate([APP_ROUTES.unauthorized]);
      return throwError(() => new Error('Unauthorized access'));
    }

    const url = `${APP_API.baseUrl}/absences/student/${absenceId}/justify`;
    return this.http.patch(url, { justification }).pipe(
      catchError((error) => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  rejectAbsence(absenceId: number): Observable<any> {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate([APP_ROUTES.login]);
      return throwError(() => new Error('Not authenticated'));
    }

    if (!this.authService.isTeacher()) {
      this.router.navigate([APP_ROUTES.unauthorized]);
      return throwError(() => new Error('Unauthorized access'));
    }

    const url = `${APP_API.baseUrl}/absences/teacher/${absenceId}/reject`;
    return this.http.patch(url, {}).pipe(
      catchError((error) => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 401) {
      this.authService.signOut();
      this.router.navigate([APP_ROUTES.login]);
    }
    return throwError(() => error);
  }
}