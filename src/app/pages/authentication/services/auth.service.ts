import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, tap, throwError, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CredentialsDto } from '../DTO/credentials.dto';
import { RegisterAdminDto, RegisterEnseignantDto } from '../DTO/register.dto';
import { APP_ROUTES } from '../app-routes.config';
import { API_CONFIG, APP_CONST } from '../api.config';
import { LoginResponseAdminDto } from '../DTO/login-response-admin.dto';
import { LoginResponseEnseignantDto } from '../DTO/login-response-enseignant.dto';

interface ApiErrorResponse {
  code: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  private currentUserSubject = new BehaviorSubject<LoginResponseAdminDto | LoginResponseEnseignantDto | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadInitialUser();
  }

  private loadInitialUser(): void {
    const userData = this.getUserData();
    if (userData) {
      this.currentUserSubject.next(userData);
    }
  }

  login(credentials: CredentialsDto): Observable<LoginResponseAdminDto | LoginResponseEnseignantDto> {
    return this.http.post<LoginResponseAdminDto | LoginResponseEnseignantDto>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH.LOGIN}`,
      credentials,
      { 
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }),
        withCredentials: true
      }
    ).pipe(
      tap({
        next: (response) => this.handleLoginSuccess(response),
        error: (error) => this.handleError(error, 'Email ou mot de passe incorrect')
      }),
      catchError(this.handleBackendError.bind(this))
    );
  }

  registerAdmin(data: RegisterAdminDto): Observable<any> {
    return this.http.post<{message: string}>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH.REGISTER_ADMIN}`,
      data,
      { 
        headers: new HttpHeaders({'Content-Type': 'application/json'}),
        withCredentials: true
      }
    ).pipe(
      tap((response) => {
        this.snackBar.open(response.message, 'Fermer', { duration: 3000 });
        this.router.navigate(['/authentication/login']);
      }),
      catchError((error: HttpErrorResponse) => {
        this.handleApiError(error);
        return throwError(() => error);
      })
    );
  }

  registerEnseignant(data: RegisterEnseignantDto): Observable<any> {
    return this.http.post<{message: string}>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH.REGISTER_ENSEIGNANT}`,
      data,
      { 
        headers: new HttpHeaders({'Content-Type': 'application/json'}),
        withCredentials: true
      }
    ).pipe(
      tap((response) => {
        this.snackBar.open(response.message, 'Fermer', { duration: 3000 });
        this.router.navigate(['/authentication/login']);
      }),
      catchError((error: HttpErrorResponse) => {
        this.handleApiError(error);
        return throwError(() => error);
      })
    );
  }

  private handleLoginSuccess(response: LoginResponseAdminDto | LoginResponseEnseignantDto): void {
    localStorage.setItem(APP_CONST.tokenLocalStorageKey, response.token);
    localStorage.setItem(APP_CONST.userRoleLocalStorageKey, response.role);
    localStorage.setItem(APP_CONST.userDataLocalStorageKey, JSON.stringify(response));
    this.currentUserSubject.next(response);
    
    this.snackBar.open('Connexion réussie', 'Fermer', { duration: 3000 });
    this.router.navigate([this.getRedirectRoute(response.role)]);
  }

  updateUserData(updatedData: any): void {
    const currentUser = this.getUserData();
    if (currentUser) {
      const newUserData = { ...currentUser, ...updatedData };
      localStorage.setItem(APP_CONST.userDataLocalStorageKey, JSON.stringify(newUserData));
      this.currentUserSubject.next(newUserData);
    }
  }

  private getRedirectRoute(role: string): string {
    return role === 'ROLE_ADMIN' 
      ? APP_ROUTES.adminDashboard 
      : APP_ROUTES.enseignantDashboard;
  }

  private handleBackendError(error: HttpErrorResponse): Observable<never> {
    console.error('Backend Error:', error);
    
    let errorMessage = 'Une erreur est survenue';
    if (error.status === 401) {
      errorMessage = 'Email ou mot de passe incorrect';
    } else if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au serveur';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
    return throwError(() => error);
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    console.error('AuthService Error:', error);
    const errorMessage = error.error?.message || error.message || defaultMessage;
    this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
  }

  private handleApiError(error: HttpErrorResponse): void {
    if (error.status === 400 && error.error) {
      const apiError = error.error as ApiErrorResponse;
      if (apiError.code === 'EMAIL_EXISTS') {
        this.snackBar.open(apiError.message, 'Fermer', { duration: 5000, panelClass: ['error-snackbar'] });
        return;
      }
    }
    this.snackBar.open("Une erreur est survenue", 'Fermer', { duration: 5000, panelClass: ['error-snackbar'] });
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'ROLE_ADMIN';
  }

  isEnseignant(): boolean {
    return this.getUserRole() === 'ROLE_ENSEIGNANT';
  }

  getToken(): string | null {
    return localStorage.getItem(APP_CONST.tokenLocalStorageKey);
  }

  getUserRole(): string | null {
    return localStorage.getItem(APP_CONST.userRoleLocalStorageKey);
  }

  getUserData(): LoginResponseAdminDto | LoginResponseEnseignantDto | null {
    const userData = localStorage.getItem(APP_CONST.userDataLocalStorageKey);
    return userData ? JSON.parse(userData) : null;
  }

  signOut(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem(APP_CONST.tokenLocalStorageKey);
    localStorage.removeItem(APP_CONST.userRoleLocalStorageKey);
    localStorage.removeItem(APP_CONST.userDataLocalStorageKey);
    this.router.navigate(['/authentication/login']);
    this.snackBar.open('Déconnexion réussie', 'Fermer', { duration: 3000 });
  }
}