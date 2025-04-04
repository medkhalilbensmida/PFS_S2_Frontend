import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of, tap, BehaviorSubject } from 'rxjs';
import { AuthService } from 'src/app/pages/authentication/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private profileImageSubject = new BehaviorSubject<string | null>(null);
  profileImage$ = this.profileImageSubject.asObservable();
  private profileDataSubject = new BehaviorSubject<any>(null);
  profileData$ = this.profileDataSubject.asObservable();

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
  
    // Données initiales par défaut
    private getInitialProfileData() {
      const user = this.authService.getUserData();
      return {
        nom: user?.nom || '',
        prenom: user?.prenom || '',
        email: user?.email || '',
        role: user?.role || '',
        photoProfil: null,
        // autres champs par défaut
      };
    }
    
  getProfileImageUrl(filename: string): string {
    // Nettoyer le filename en supprimant les éventuels chemins existants
    const cleanFilename = filename.replace(/^.*\/api\/images\/profile\//, '') // Supprime tout ce qui précède
                                 .replace(/^\//, ''); // Supprime le slash initial
    
    return `/api/images/profile/${cleanFilename}`;
}

getAuthenticatedImage(url: string): Observable<string> {
  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  
  return this.http.get(fullUrl, {
    responseType: 'blob',
    headers: new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    })
  }).pipe(
    map(blob => {
      const objectUrl = URL.createObjectURL(blob);
      // Vérifier que le blob contient bien une image
      if (blob.size === 0 || !blob.type.startsWith('image/')) {
        throw new Error('Invalid image blob');
      }
      return objectUrl;
    }),
    catchError(error => {
      console.error('Error loading image:', error);
      // Retourner une Observable avec l'URL par défaut
      return of(this.getDefaultProfileImage());
    })
  );
}

  getDefaultProfileImage(): string {
    return '/api/images/default/profile/user.jpg';
  }

  getDefaultProfileOptions(): Observable<string[]> {
    return this.http.get<string[]>('/api/images/default-profiles');
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

    return this.http.get(endpoint, { headers: this.getHeaders() }).pipe(
      tap(profileData => {
        this.profileDataSubject.next(profileData);
        this.authService.updateUserData(profileData);
      })
    );
  }

  updateProfileImage(imageUrl: string): void {
    const timestamp = new Date().getTime();
    const cachedUrl = `${imageUrl}?t=${timestamp}`;
    this.profileImageSubject.next(cachedUrl);
  }

  updateProfile(profileData: any): Observable<any> {
    const currentData = this.profileDataSubject.value;
    const userData = this.authService.getUserData();
    const userId = userData?.id;
    const role = this.authService.getUserRole();

    let endpoint = '';
    if (role === 'ROLE_ADMIN') {
      endpoint = `/api/administrateurs/${userId}`;
    } else if (role === 'ROLE_ENSEIGNANT') {
      endpoint = `/api/enseignants/${userId}`;
    }

    const dataToSend = {
      ...currentData,
      ...profileData,
      // Garde la photo existante si non fournie
      photoProfil: profileData.photoProfil ?? currentData?.photoProfil
    };

    return this.http.put(endpoint, dataToSend, { headers: this.getHeaders() }).pipe(
      tap((updatedData: any) => {
        const completeData = {
          ...updatedData,
          photoProfil: updatedData.photoProfil ?? currentData?.photoProfil
        };
        this.profileDataSubject.next(completeData);
        this.authService.updateUserData(completeData);
        
        // Émettre spécifiquement la nouvelle image
        if (updatedData.photoProfil) {
          this.updateProfileImage(updatedData.photoProfil);
        }
      })
    );
  }
}