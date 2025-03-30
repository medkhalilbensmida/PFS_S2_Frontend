import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { SessionExamen, AddSessionExamenDTO, AnneeUniversitaire } from '../models/session.model';
import { API_CONFIG } from 'src/app/pages/authentication/api.config';

@Injectable({
  providedIn: 'root',
})
export class SessionExamenService {
  private apiUrl = `${API_CONFIG.BASE_URL}/sessions`;
  private anneeUrl = `${API_CONFIG.BASE_URL}/annees`;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    if (error.error && typeof error.error === 'object' && error.error.message) {
      return throwError(() => ({ 
        status: error.status,
        message: error.error.message 
      }));
    }
    return throwError(() => ({
      status: error.status,
      message: error.message || 'Une erreur inattendue est survenue'
    }));
  }

  getAnneesUniversitaires(): Observable<AnneeUniversitaire[]> {
    return this.http.get<any[]>(this.anneeUrl).pipe(
      map(annees => annees.map(a => ({
        id: a.id,
        dateDebut: a.dateDebut,
        dateFin: a.dateFin,
        estActive: a.estActive,
        // Génère automatiquement le libellé d'année si nécessaire
        annee: `Année ${new Date(a.dateDebut).getFullYear()}-${new Date(a.dateFin).getFullYear()}`
      }))),
      catchError(this.handleError)
    );
  }

  getSessions(): Observable<SessionExamen[]> {
    return this.http.get<SessionExamen[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getSessionById(id: number): Observable<SessionExamen> {
    return this.http.get<SessionExamen>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createSession(sessionDto: AddSessionExamenDTO): Observable<SessionExamen> {
    return this.http.post<SessionExamen>(this.apiUrl, sessionDto).pipe(
      catchError(this.handleError)
    );
  }

  updateSession(id: number, session: SessionExamen): Observable<SessionExamen> {
    return this.http.put<SessionExamen>(`${this.apiUrl}/${id}`, session).pipe(
      catchError(this.handleError)
    );
  }

  deleteSession(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }
}