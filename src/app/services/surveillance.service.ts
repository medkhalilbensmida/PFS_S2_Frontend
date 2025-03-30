import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../pages/authentication/api.config';

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

@Injectable({
  providedIn: 'root'
})
export class SurveillanceService {
  
  private apiUrl = `${API_CONFIG.BASE_URL}`;

  constructor(private http: HttpClient) { }

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
    return this.http.get<Surveillance[]>(`${this.apiUrl}/surveillances`, { params: { sessionId: sessionId.toString() } });
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
  assignEnseignants(surveillanceId: number, request: AssignmentRequest): Observable<Surveillance> {
    return this.http.put<Surveillance>(`${this.apiUrl}/surveillances/${surveillanceId}/assign`, request);
  }

  /**
   * Récupère la liste de tous les enseignants
   */
  getAllEnseignants(): Observable<Enseignant[]> {
    return this.http.get<Enseignant[]>(`${this.apiUrl}/enseignants`);
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
}
