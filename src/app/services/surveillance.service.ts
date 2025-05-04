import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_CONFIG } from '../pages/authentication/api.config';
import { HttpParams, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { AuthService } from '../pages/authentication/services/auth.service';

export interface Surveillance {
  id: number;
  dateDebut: Date;
  dateFin: Date;
  statut: string;
  salleId?: number;
  matiereId?: number;
  enseignantPrincipalId?: number;
  enseignantSecondaireId?: number;
  sessionExamenId?: number;
  salleName?: string;
  matiereName?: string;
}

export interface Enseignant {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  grade?: string;
  departement?: string;
}

export interface EnseignantDTO {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  grade?: string;
  departement?: string;
}

export interface NotificationEmailDTO {
  toEmail: string;
  subject: string;
  message: string;
  date: Date;
  template: string;
  session: number;
}

export interface MailRequest {
  toEmail: string;
  subject: string;
  template: string;
  isHtml: boolean;
  context: { [key: string]: any };
  attachments?: Attachment[];
}

export interface Attachment {
  fileName: string;
  fileData: Blob;
}

export interface Notification {
  id?: number;
  message: string;
  dateEnvoi?: Date;
  estLue?: boolean;
  type: string;
  destinataireId: number;
  surveillanceId?: number;
  emailEnvoye?: boolean;
}

export interface SessionExamenDetailsDTO {
  id: number;
  dateDebut: string;
  dateFin: string;
  type: string;
  estActive: boolean;
  anneeUniversitaireId: number;
  numSemestre: string;
  surveillances: Surveillance[];
}

export interface AssignmentRequest {
  enseignantPrincipalId?: number;
  enseignantSecondaireId?: number;
}

export interface DisponibiliteEnseignantDTO {
  id: number;
  estDisponible: boolean;
  enseignantId?: number;
  enseignantNom?: string;
  enseignantPrenom?: string;
  surveillanceId?: number;
}

export interface CreateSurveillancePayload {
  dateDebut: string;
  dateFin: string;
  statut: string;
  salleId?: number | null;
  matiereId?: number | null;
  sessionExamenId: number;
  enseignantPrincipalId?: number | null;
  enseignantSecondaireId?: number | null;
}

export interface Salle {
  id: number;
  numero: string;
  capacite?: number;
  batiment?: string;
  etage?: string;
}

export interface Section {
  name: string;
  studentNumber?: number;
}

export interface Matiere {
  id: number;
  niveau?: string;
  section?: Section;
  code?: string;
  nom: string;
}

@Injectable({
  providedIn: 'root'
})
export class SurveillanceService {
  private apiUrl = `${API_CONFIG.BASE_URL}`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getAllSurveillances(): Observable<Surveillance[]> {
    return this.http.get<Surveillance[]>(`${this.apiUrl}/surveillances`)
      .pipe(
        map(surveillances => this.processSurveillances(surveillances))
      );
  }

  getSurveillancesBySessionId(sessionId: number): Observable<Surveillance[]> {
    return this.http.get<Surveillance[]>(`${this.apiUrl}/surveillances/session/${sessionId}`)
      .pipe(
        map(surveillances => this.processSurveillances(surveillances))
      );
  }

  private processSurveillances(surveillances: Surveillance[]): Surveillance[] {
    return surveillances.map(s => ({
      ...s,
      dateDebut: new Date(s.dateDebut),
      dateFin: new Date(s.dateFin),
      salleName: s.salleName || 'Non spécifiée',
      matiereName: s.matiereName || 'Non spécifiée'
    }));
  }

  private processSurveillance(s: Surveillance): Surveillance {
    return {
      ...s,
      dateDebut: new Date(s.dateDebut),
      dateFin: new Date(s.dateFin),
      salleName: s.salleName || 'Non spécifiée',
      matiereName: s.matiereName || 'Non spécifiée'
    };
  }

  getSurveillanceById(id: number): Observable<Surveillance> {
    return this.http.get<Surveillance>(`${this.apiUrl}/surveillances/${id}`)
      .pipe(
        map(s => this.processSurveillance(s))
      );
  }

  assignEnseignants(surveillanceId: number, request: AssignmentRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/surveillances/${surveillanceId}/assign`, request, { responseType: 'text' });
  }

  getAllEnseignants(): Observable<Enseignant[]> {
    return this.http.get<Enseignant[]>(`${this.apiUrl}/enseignants`);
  }

  getEnseignantsForSession(sessionId: number): Observable<EnseignantDTO[]> {
    return this.http.get<EnseignantDTO[]>(`${this.apiUrl}/sessions/${sessionId}/enseignants`);
  }

  createSurveillance(surveillancePayload: CreateSurveillancePayload): Observable<Surveillance> {
    return this.http.post<Surveillance>(`${this.apiUrl}/surveillances`, surveillancePayload)
      .pipe(
        map(s => this.processSurveillance(s))
      );
  }

  deleteSurveillance(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/surveillances/${id}`);
  }

  updateSurveillance(id: number, surveillance: any): Observable<Surveillance> {
    return this.http.put<Surveillance>(`${this.apiUrl}/surveillances/${id}`, surveillance)
      .pipe(
        map(s => this.processSurveillance(s))
      );
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEnseignantFullName(id: number | undefined, enseignants: Enseignant[]): string {
    if (!id) return 'Non affecté';
    const enseignant = enseignants.find(e => e.id === id);
    return enseignant ? `${enseignant.prenom} ${enseignant.nom}` : 'Inconnu';
  }

  getEnseignantDisponibilites(surveillanceId: number): Observable<DisponibiliteEnseignantDTO[]> {
    return this.http.get<DisponibiliteEnseignantDTO[]>(`${this.apiUrl}/disponibilites/surveillance/${surveillanceId}`);
  }

  getAllSalles(): Observable<Salle[]> {
    return this.http.get<Salle[]>(`${this.apiUrl}/salles`);
  }

  getAllMatieres(): Observable<Matiere[]> {
    return this.http.get<Matiere[]>(`${this.apiUrl}/matieres/All`);
  }

  getMyDisponibilites(): Observable<DisponibiliteEnseignantDTO[]> {
    return this.http.get<DisponibiliteEnseignantDTO[]>(`${this.apiUrl}/disponibilites/my-disponibilities`);
  }

  markDisponibilite(surveillanceId: number): Observable<DisponibiliteEnseignantDTO> {
    const url = `${this.apiUrl}/disponibilites/surveillance/${surveillanceId}`;
    const currentUser = this.authService.getUserData();
    
    const body = {
      enseignantId: currentUser?.id
    };

    return this.http.put<DisponibiliteEnseignantDTO>(
      url,
      body,
      {
        params: new HttpParams().set('estDisponible', 'true'),
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        }),
        withCredentials: true
      }
    ).pipe(
      tap(response => {
        if (response.enseignantId !== currentUser?.id) {
          console.error('User ID mismatch:', {
            responseUserId: response.enseignantId,
            currentUserId: currentUser?.id
          });
        }
      })
    );
  }

  cancelDisponibilite(surveillanceId: number): Observable<DisponibiliteEnseignantDTO> {
    const url = `${this.apiUrl}/disponibilites/surveillance/${surveillanceId}`;
    const currentUser = this.authService.getUserData();

    const body = {
      enseignantId: currentUser?.id
    };

    return this.http.put<DisponibiliteEnseignantDTO>(
      url,
      body,
      {
        params: new HttpParams().set('estDisponible', 'false'),
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        }),
        withCredentials: true
      }
    ).pipe(
      tap(response => {
        if (response.enseignantId !== currentUser?.id) {
          console.error('User ID mismatch:', {
            responseUserId: response.enseignantId,
            currentUserId: currentUser?.id
          });
        }
      })
    );
  }

  checkDisponibilite(surveillanceId: number): Observable<boolean> {
    return this.http.get<DisponibiliteEnseignantDTO[]>(
      `${this.apiUrl}/disponibilites/surveillance/${surveillanceId}`
    ).pipe(
      map(disponibilites => {
        const disponibilite = disponibilites[0];
        return disponibilite ? disponibilite.estDisponible : false;
      })
    );
  }

  sendEmailToAll(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/emails/send-all`, {});
  }

  sendEmailList(notifications: Notification[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/emails/send-list`, notifications);
  }

  sendSingleEmail(notification: Notification): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/emails/send-notif`, notification);
  }

  sendEmailDTO(dto: NotificationEmailDTO): Observable<string> {
    return this.http.post(`${this.apiUrl}/emails/send-dto`, dto, {
      responseType: 'text'
    }).pipe(
      catchError(error => {
        console.error('Error sending email:', error);
        return throwError(() => new Error('Failed to send email'));
      })
    );
  }

  sendEmail(emailData: NotificationEmailDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/notifications/send-email`, emailData);
  }
}