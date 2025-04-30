import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../pages/authentication/api.config';
import { AuthService } from '../pages/authentication/services/auth.service';

export enum Semestre {
  S1 = 'S1',
  S2 = 'S2'
}

export enum TypeSession {
  DS = 'DS',
  EXAMEN = 'EXAMEN',
  RATTRAPAGE = 'RATTRAPAGE'
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${API_CONFIG.BASE_URL}/surveillances`; // Add /surveillances to match controller mapping

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  exportToExcel(params: any): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/excel`, {
      headers: this.getHeaders(),
      params,
      responseType: 'blob'
    });
  }

  exportToCsv(params: any): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/csv`, {
      headers: this.getHeaders(),
      params,
      responseType: 'blob'
    });
  }

  generateConvocation(enseignantId: number, params: any): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/generateconvocation/${enseignantId}`, {
      headers: this.getHeaders(),
      params,
      responseType: 'blob'
    });
  }

  generateAllConvocations(params: any): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/generateallconvocations`, {
      headers: this.getHeaders(),
      params,
      responseType: 'blob'
    });
  }
}