import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/pages/authentication/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient,
    private authService: AuthService
  ) { }

  uploadFiles(files: File[]): Observable<any[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return this.http.post<any[]>(`${this.apiUrl}/files/upload`, formData);
  }

  getFileUrl(fileId: number): string {
    const token = this.authService.getToken();
    return `${this.apiUrl}/files/${fileId}?token=${token}`;
  }

  downloadFileBlob(fileId: number): Observable<Blob> {
    const fileUrl = this.getFileUrl(fileId);
    return this.http.get(fileUrl, { responseType: 'blob' });
  }
}