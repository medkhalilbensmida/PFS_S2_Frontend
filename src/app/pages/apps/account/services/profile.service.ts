import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from 'src/app/pages/authentication/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  getProfile(): Observable<any> {
    const userData = this.authService.getUserData();
    const userId = userData?.id;
    const role = this.authService.getUserRole();

    let endpoint = '';
    if (role === 'ROLE_ADMIN') {
      endpoint = `/api/administrateurs/${userId}`;
    } else if (role === 'ROLE_ENSEIGNANT') {
      endpoint = `/api/enseignants/${userId}`;
    }

    return this.http.get(endpoint, { 
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getToken()}`
      })
    });
  }

  updateProfile(profileData: any): Observable<any> {
    const userData = this.authService.getUserData();
    const userId = userData?.id;
    const role = this.authService.getUserRole();

    let endpoint = '';
    if (role === 'ROLE_ADMIN') {
      endpoint = `/api/administrateurs/${userId}`;
    } else if (role === 'ROLE_ENSEIGNANT') {
      endpoint = `/api/enseignants/${userId}`;
    }

    return this.http.put(endpoint, profileData, { headers: this.getHeaders() }).pipe(
      tap((updatedData: any) => {
        this.authService.updateUserData(updatedData);
      })
    );
  }
}