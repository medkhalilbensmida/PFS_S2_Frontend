import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_CONFIG } from '../pages/authentication/api.config';
import { HttpParams, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { AuthService } from '../pages/authentication/services/auth.service';
import { LongDateFormatKey } from 'moment';

// Add these interfaces
export interface NotificationEmailDTO {
  toEmail: string;
  subject: string;
  message: string;
  date: Date;
  template: string;
  session:number;
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
  dateDebut: string; // or use Date if you'll parse it
  dateFin: string;   // or use Date if you'll parse it
  type: string;
  estActive: boolean;
  anneeUniversitaireId: number;
  numSemestre: string;
  surveillances: Surveillance[];
}
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
export interface EnseignantDTO {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  grade?: string;
  departement?: string;
}

export interface Enseignant {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  grade?: string;
  departement?: string;
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

// Interface for the payload when CREATING a surveillance (with string dates)
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

  /**
   * Récupère la liste de toutes les surveillances
   */
  getAllSurveillances(): Observable<Surveillance[]> {
    return this.http.get<Surveillance[]>(`${this.apiUrl}/surveillances`);
  }

  /**
   * Récupère les surveillances pour une session spécifique
   */
  getSurveillancesBySessionId(sessionId: number): Observable<Surveillance[]> {
    return this.http.get<SessionExamenDetailsDTO>(`${this.apiUrl}/sessions/detailed/${sessionId}`).pipe(
        map(response => response.surveillances) // assuming 'surveillances' is the property name
    );
}
  /**
   * Récupère une surveillance spécifique par son ID
   */
  getSurveillanceById(id: number): Observable<Surveillance> {
    return this.http.get<Surveillance>(`${this.apiUrl}/surveillances/${id}`);
  }

  /**
   * Assigne des enseignants à une surveillance
   */
  assignEnseignants(surveillanceId: number, request: AssignmentRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/surveillances/${surveillanceId}/assign`, request, { responseType: 'text' });
  }

  /**
   * Récupère la liste de tous les enseignants
   */
  getAllEnseignants(): Observable<Enseignant[]> {
    return this.http.get<Enseignant[]>(`${this.apiUrl}/enseignants`);
  }

  /**
   * Crée une nouvelle surveillance
   * Accepts payload with string dates
   * Returns the created Surveillance object (which might have Date objects)
   */
  createSurveillance(surveillancePayload: CreateSurveillancePayload): Observable<Surveillance> {
    // The payload sent matches CreateSurveillancePayload (string dates)
    // The expected response type from the API is Surveillance (Date objects)
    return this.http.post<Surveillance>(`${this.apiUrl}/surveillances`, surveillancePayload);
  }

  /**
   * Supprime une surveillance par son ID
   */
  deleteSurveillance(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/surveillances/${id}`);
  }

  getEnseignantsForSession(sessionId: number): Observable<EnseignantDTO[]> {
    return this.http.get<EnseignantDTO[]>(`${this.apiUrl}/sessions/${sessionId}/enseignants`);
  }

  /**
   * Formate une date selon la locale française
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtient le nom complet d'un enseignant à partir de son ID
   */
  getEnseignantFullName(id: number | undefined, enseignants: Enseignant[]): string {
    if (!id) return 'Non affecté';
    const enseignant = enseignants.find(e => e.id === id);
    return enseignant ? `${enseignant.prenom} ${enseignant.nom}` : 'Inconnu';
  }

  /**
   * Récupère la liste des disponibilités des enseignants pour une surveillance spécifique
   */
  getEnseignantDisponibilites(surveillanceId: number): Observable<DisponibiliteEnseignantDTO[]> {
    return this.http.get<DisponibiliteEnseignantDTO[]>(`${this.apiUrl}/disponibilites/surveillance/${surveillanceId}`);
  }

  /**
   * Met à jour une surveillance existante
   */
  updateSurveillance(id: number, surveillance: any): Observable<Surveillance> {
    return this.http.put<Surveillance>(`${this.apiUrl}/surveillances/${id}`, surveillance);
  }

  /**
   * Récupère la liste de toutes les salles
   */
  getAllSalles(): Observable<Salle[]> {
    return this.http.get<Salle[]>(`${this.apiUrl}/salles`);
  }

  /**
   * Récupère la liste de toutes les matières
   */
  getAllMatieres(): Observable<Matiere[]> {
    return this.http.get<Matiere[]>(`${this.apiUrl}/matieres/All`);
  }


   /*----PARTIE DISPONIBILITE-----------*/


 /**
   * Get disponibilités for the current enseignant
   */
 getMyDisponibilites(): Observable<DisponibiliteEnseignantDTO[]> {
  return this.http.get<DisponibiliteEnseignantDTO[]>(`${this.apiUrl}/disponibilites/my-disponibilities`);
}


markDisponibilite(surveillanceId: number): Observable<DisponibiliteEnseignantDTO> {
  console.log(`Sending PUT request to mark disponibilite for surveillance ${surveillanceId}`);
  
  const url = `${this.apiUrl}/disponibilites/surveillance/${surveillanceId}`;
  const currentUser = this.authService.getUserData();
  
  // Add enseignantId to the request body
  const body = {
    enseignantId: currentUser?.id
  };

  return this.http.put<DisponibiliteEnseignantDTO>(
    url,
    body, // Send the body with enseignantId
    {
      params: new HttpParams().set('estDisponible', 'true'),
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      withCredentials: true
    }
  ).pipe(
    tap(response => {
      console.log('Mark disponibilite response:', response);
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
  console.log(`Sending PUT request to cancel disponibilite for surveillance ${surveillanceId}`);
  
  const url = `${this.apiUrl}/disponibilites/surveillance/${surveillanceId}`;
  const currentUser = this.authService.getUserData();

  // Add enseignantId to the request body
  const body = {
    enseignantId: currentUser?.id
  };

  return this.http.put<DisponibiliteEnseignantDTO>(
    url,
    body, // Send the body with enseignantId
    {
      params: new HttpParams().set('estDisponible', 'false'),
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      withCredentials: true
    }
  ).pipe(
    tap(response => {
      console.log('Cancel disponibilite response:', response);
      if (response.enseignantId !== currentUser?.id) {
        console.error('User ID mismatch:', {
          responseUserId: response.enseignantId,
          currentUserId: currentUser?.id
        });
      }
    })
  );
}

/**
 * Check if current enseignant is available for a surveillance
 */
checkDisponibilite(surveillanceId: number): Observable<boolean> {
  return this.http.get<DisponibiliteEnseignantDTO[]>(
    `${this.apiUrl}/disponibilites/surveillance/${surveillanceId}`
  ).pipe(
    map(disponibilites => {
      // Find the current user's disponibilité
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
    responseType: 'text'  // Explicitly tell Angular to expect text response
  }).pipe(
    catchError(error => {
      // Handle HTTP errors
      console.error('Error sending email:', error);
      return throwError(() => new Error('Failed to send email'));
    })
  );
}

// sendTemplatedEmail(dto: NotificationEmailDTO): Observable<void> {
//   const mailRequest: MailRequest = {
//     toEmail: dto.toEmail,
//     subject: dto.subject,
//     template: dto.template,
//     isHtml: true,
//     context: {
//       professorName: `${dto.prenom} ${dto.nom}`,
//       message: dto.message,
//       date: new Date().toLocaleDateString()
//     }
//   };
  
//   return this.http.post<void>(`${this.apiUrl}/emails/send-templated`, mailRequest);
// }


}