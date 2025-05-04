import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Client } from '@stomp/stompjs';  // Updated import
import * as SockJS from 'sockjs-client';
import { AuthService } from '../pages/authentication/services/auth.service';
import { API_CONFIG } from '../pages/authentication/api.config';

@Injectable({
  providedIn: 'root'
})
export class NotificationSocketService implements OnDestroy {
  private stompClient: Client;
  private notificationsSubject = new BehaviorSubject<any[]>([]);
  private connected = false;
  private readonly RECONNECT_TIMEOUT = 5000;
  private readonly MAX_RETRIES = 5;
  private retryCount = 0;
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService) {
    this.initializeConnection();
  }

  private initializeConnection(): void {
    try {
      const token = this.authService.getToken(); // Add this line: Get token from AuthService
      const wsUrl = `http://localhost:8080/ws-notifications?token=${encodeURIComponent(token!)}`;

      this.stompClient = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        reconnectDelay: this.RECONNECT_TIMEOUT,
        connectHeaders: {
          Authorization: `Bearer ${token}` // Add Authorization header here
        },
        debug: (str) => {
          // Optional logging
          console.log(str);
        }
      });
  
      this.stompClient.onConnect = () => this.onConnect();
      this.stompClient.onStompError = (frame) => this.onError(frame);
      this.stompClient.onWebSocketError = (event) => {
        console.error('WebSocket error:', event);
        this.handleReconnection();
      };

      this.stompClient.activate();
    } catch (error) {
      console.error('WebSocket initialization error:', error);
      this.handleReconnection();
    }
  }
  

  private onConnect(): void {
    this.connected = true;
    this.retryCount = 0;
    this.subscribeToNotifications();
  }

  private onError(error: any): void {
    console.error('WebSocket connection error:', error);
    this.connected = false;
    this.handleReconnection();
  }

  private handleReconnection(): void {
    if (this.retryCount < this.MAX_RETRIES) {
      this.retryCount++;
      setTimeout(() => this.initializeConnection(), this.RECONNECT_TIMEOUT);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private subscribeToNotifications(): void {
    if (!this.stompClient || !this.connected) return;

    const currentUser = this.authService.getUserData();
    if (currentUser && currentUser.email) {
        // Subscribe using email as the user destination
        this.stompClient.subscribe(
            `/user/${currentUser.email}/queue/notifications`,
            (message) => this.handleNotificationMessage(message)
        );

        // Request initial load
        this.stompClient.publish({
            destination: '/app/notifications.load',
            body: JSON.stringify({})
        });
    }
}
private handleNotificationMessage(message: any): void {
  try {
      console.log('Raw notification message:', message); // Debug log
      const data = JSON.parse(message.body);
      if (Array.isArray(data)) {
          // Convert timestamp back to Date
          const notifications = data.map(n => ({
              ...n,
              dateEnvoi: new Date(n.dateEnvoi)
          }));
          this.notificationsSubject.next(notifications);
      } else {
          const notification = {
              ...data,
              dateEnvoi: new Date(data.dateEnvoi)
          };
          const current = this.notificationsSubject.value;
          this.notificationsSubject.next([notification, ...current]);
      }
  } catch (error) {
      console.error('Error processing notification message:', error);
  }
}
  getNotifications(): Observable<any[]> {
    return this.notificationsSubject.asObservable();
  }

  markAsRead(notificationId: number): void {
    if (this.connected && this.stompClient) {
      this.stompClient.publish({
        destination: '/app/notifications.read',
        body: JSON.stringify({ id: notificationId })
      });
    }
  }

  disconnect(): void {
    if (this.stompClient && this.connected) {
      this.stompClient.deactivate();
      this.connected = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}