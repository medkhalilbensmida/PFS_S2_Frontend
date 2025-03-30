import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  constructor(private translate: TranslateService) {}

  initialize(): Promise<void> {
    this.translate.setDefaultLang('fr');
    
    return new Promise((resolve) => {
      this.translate.use('fr').pipe(
        catchError(error => {
          console.warn('Using default translations due to load error', error);
          return of({});
        })
      ).subscribe({
        next: () => {
          console.log('Translations loaded successfully');
          resolve();
        },
        error: () => {
          console.warn('Using default translations');
          resolve(); 
        }
      });
    });
  }
}