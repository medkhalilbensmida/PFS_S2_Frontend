import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../pages/authentication/api.config';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${API_CONFIG.BASE_URL}/api/notifications`;

  constructor(private http: HttpClient) { }

  markMultipleAsRead(notificationIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/mark-read`, {ids: notificationIds});
  }
}